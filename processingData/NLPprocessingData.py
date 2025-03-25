import os
import json
import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import faiss
from transformers import pipeline, DistilBertTokenizer, DistilBertForSequenceClassification
import torch
from lightfm import LightFM
from scipy.sparse import csr_matrix
from fastapi import FastAPI
from typing import Optional

# Initialize FastAPI
app = FastAPI()

# --- 1. MongoDB Setup ---
load_dotenv()

class MongoDBConnector:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_DB_URI"))
        self.db = self.client['ecommerce_db']
        self.products = self.db['products']
        self.user_actions = self.db['user_actions']
        self.chat_logs = self.db['chat_logs']
    
    def get_product_data(self):
        """Retrieve and preprocess product data"""
        cursor = self.products.find({})
        df = pd.DataFrame(list(cursor))
        
        # Clean data
        df['categories'] = df['categories'].apply(
            lambda x: json.loads(x) if isinstance(x, str) else x)
        df['features'] = df['features'].apply(
            lambda x: " ".join(json.loads(x)) if isinstance(x, str) else " ".join(x))
        df['final_price'] = pd.to_numeric(
            df['final_price'].str.replace('"', ''), errors='coerce')
        
        return df

    def get_user_interactions(self, user_id=None):
        """Get user-item interaction matrix"""
        pipeline = [
            {"$match": {"action_type": "purchase"}},
            {"$group": {"_id": "$user_id", "items": {"$push": "$product_id"}}}
        ]
        if user_id:
            pipeline[0]["$match"]["user_id"] = user_id
            
        return list(self.user_actions.aggregate(pipeline))

# --- 2. ML Components ---
class MLModels:
    def __init__(self, db_connector):
        self.db = db_connector
        self.product_df = None
        self.index = None
        self.encoder = None
        self.rec_model = None
        self.intent_model = None
        self.tokenizer = None
        self.ner_pipeline = None
        
    def initialize_models(self):
        """Initialize all ML models"""
        # Load product data
        self.product_df = self.db.get_product_data()
        
        # Semantic Search
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self._build_faiss_index()
        
        # Recommendation System
        self._train_recommendation_model()
        
        # Intent Recognition
        self.tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
        self.intent_model = DistilBertForSequenceClassification.from_pretrained(
            'distilbert-base-uncased', num_labels=4)
        
        # NER Pipeline
        self.ner_pipeline = pipeline(
            "ner", 
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            aggregation_strategy="simple"
        )
    
    def _build_faiss_index(self):
        """Create FAISS index for semantic search"""
        if 'embedding' not in self.product_df.columns:
            self.product_df['embedding'] = self.product_df.apply(
                lambda x: self.encoder.encode(
                    f"{x['title']} {x['description']} {x['features']}"
                ).tolist(),
                axis=1
            )
            
        embeddings = np.array(self.product_df['embedding'].tolist()).astype('float32')
        self.index = faiss.IndexFlatIP(embeddings.shape[1])
        self.index.add(embeddings)
    
    def _train_recommendation_model(self):
        """Train LightFM recommendation model"""
        interactions = self.db.get_user_interactions()
        user_ids = {u['_id']: idx for idx, u in enumerate(interactions)}
        item_ids = {p: idx for idx, p in enumerate(self.product_df['asin'].unique())}
        
        data, row, col = [], [], []
        for user in interactions:
            for item in user['items']:
                if item in item_ids:
                    row.append(user_ids[user['_id']])
                    col.append(item_ids[item])
                    data.append(1)
                    
        interaction_matrix = csr_matrix((data, (row, col)))
        self.rec_model = LightFM(loss='warp')
        self.rec_model.fit(interaction_matrix, epochs=20)
    
    def search_products(self, query, k=5, filters=None):
        """Semantic product search"""
        query_embedding = self.encoder.encode([query])
        distances, indices = self.index.search(query_embedding, k*3)
        
        results = self.product_df.iloc[indices[0]].copy()
        results['similarity'] = distances[0]
        
        if filters:
            if 'max_price' in filters:
                results = results[results['final_price'] <= filters['max_price']]
            if 'min_rating' in filters:
                results = results[results['rating'] >= filters['min_rating']]
        
        return results.head(k).to_dict('records')
    
    def get_recommendations(self, user_id, n=5):
        """Personalized recommendations"""
        interactions = self.db.get_user_interactions(user_id)
        if not interactions:
            return self.search_products("best selling", n)
            
        user_idx = 0  # Simplified for demo
        item_ids = {p: idx for idx, p in enumerate(self.product_df['asin'].unique())}
        scores = self.rec_model.predict(user_idx, np.arange(len(item_ids)))
        top_items = np.argsort(-scores)[:n]
        
        return self.product_df[
            self.product_df['asin'].isin([list(item_ids.keys())[i] for i in top_items])
        ].to_dict('records')
    
    def predict_intent(self, text):
        """Classify user intent"""
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True)
        with torch.no_grad():
            outputs = self.intent_model(**inputs)
        return torch.argmax(outputs.logits).item()
    
    def extract_entities(self, text):
        """Extract product-related entities"""
        entities = self.ner_pipeline(text)
        return {
            e['entity_group']: e['word'] 
            for e in entities 
            if e['entity_group'] in ['PRODUCT', 'BRAND', 'PRICE']
        }

# --- 3. Chatbot Core ---
class EcommerceChatbot:
    def __init__(self):
        self.db = MongoDBConnector()
        self.ml = MLModels(self.db)
        self.ml.initialize_models()
        self.intent_map = {
            0: "product_search",
            1: "order_tracking",
            2: "recommendation",
            3: "general_inquiry"
        }
    
    def process_query(self, user_query, user_id=None, filters=None):
        """Main processing pipeline"""
        # Step 1: Intent Recognition
        intent_id = self.ml.predict_intent(user_query)
        intent_type = self.intent_map.get(intent_id, "general_inquiry")
        
        # Step 2: Entity Extraction
        entities = self.ml.extract_entities(user_query)
        
        # Step 3: Route to appropriate handler
        if intent_type == "product_search":
            query = " ".join([entities.get('PRODUCT', ''), user_query])
            results = self.ml.search_products(query, filters=filters)
            return {
                "intent": "product_search",
                "results": results,
                "entities": entities
            }
            
        elif intent_type == "recommendation" and user_id:
            results = self.ml.get_recommendations(user_id)
            return {
                "intent": "recommendation",
                "results": results
            }
            
        else:
            return {
                "intent": intent_type,
                "response": "How can I assist you further with this?"
            }

# --- 4. API Endpoints ---
chatbot = EcommerceChatbot()

@app.post("/query")
async def handle_query(
    query: str,
    user_id: Optional[str] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None
):
    filters = {}
    if max_price:
        filters['max_price'] = max_price
    if min_rating:
        filters['min_rating'] = min_rating
        
    return chatbot.process_query(query, user_id, filters)

@app.get("/product/{product_id}")
async def get_product(product_id: str):
    product = chatbot.db.products.find_one({"asin": product_id}, {"_id": 0})
    return product

# --- Run the API ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)