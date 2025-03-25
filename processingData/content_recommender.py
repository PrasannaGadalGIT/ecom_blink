import numpy as np
import faiss
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import spacy

# Load pre-trained NLP model
nlp = spacy.load("en_core_web_sm")  

load_dotenv()

class QueryRecommender:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_DB_URI"))
        self.db = self.client['ecommerce']
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.index, self.products = self._initialize_system()
    
    def _initialize_system(self):
       
        products = list(self.db.products.find({}, {
            "title": 1, "description": 1, "categories": 1,
            "rating": 1, "final_price": 1, "image_url": 1,
            "asin": 1, "embedding": 1, "stock": 1, "url": 1  
        }))
        
     
        for product in products:
            try:
                product['rating'] = float(product.get('rating', 0))
                product['final_price'] = float(product.get('final_price', 0))
                product['stock'] = int(product.get('stock', 0))
            except ValueError:
                product['final_price'] = 0.0
                product['stock'] = 0

    
        embeddings = np.array([p['embedding'] for p in products], dtype='float32')
        faiss.normalize_L2(embeddings) 
        
        index = faiss.IndexFlatIP(embeddings.shape[1])  
        index.add(embeddings)
        
        return index, products
    
    def extract_filters_ner(self, query: str):
       
        filters = {}
        doc = nlp(query)

        for ent in doc.ents:
            if ent.label_ == "MONEY":  
                filters["max_price"] = float(ent.text.replace("$", "").strip())
            elif ent.label_ == "ORDINAL" and "stars" in query:  
                filters["min_rating"] = float(ent.text)
            elif ent.label_ in ["PRODUCT", "ORG"]: 
                filters["brand"] = ent.text.lower()
            elif ent.label_ == "GPE" and "in" in query:  
                filters["region"] = ent.text.lower()  

        return filters
    
    def process_query(self, query: str, k: int = 5) -> List[Dict]:
        
    
        filters = self.extract_filters_ner(query)  # Use NER-based filtering
    
        query_embedding = self.encoder.encode([query])[0]
        query_embedding = np.array([query_embedding], dtype='float32')
        faiss.normalize_L2(query_embedding)

        distances, indices = self.index.search(query_embedding, k * 5)  # Retrieve more, filter later

        results = []
        for i, idx in enumerate(indices[0]):
            product = self.products[idx]

        
            if "min_rating" in filters and product["rating"] < filters["min_rating"]:
                continue
            if "max_price" in filters and product["final_price"] > filters["max_price"]:
                continue
            if "brand" in filters and filters["brand"] not in product["title"].lower():
                continue
            if "region" in filters and filters["region"] not in product["categories"]:
                continue
            if product["stock"] == 0:  # Check for availability
                continue
            product(product)
            # If the product passes all filters, add it to the result
            results.append({
                "title": product['title'],
                "description": product['description'],
                "price": product['final_price'],
                "rating": product['rating'],
                "image_url": product['image_url'],
                "similarity_score": float(distances[0][i]),
                "product_id": product['asin'],
                "amazon_url": product['url']
            })

            if len(results) >= k:
                break

        return sorted(results, key=lambda x: x["similarity_score"], reverse=True)[:k]
