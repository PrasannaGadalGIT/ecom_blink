from flask import Flask, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from flask_cors import CORS
import spacy
import re
import json
import ollama
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from functools import lru_cache

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# Initialize Ollama client
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama2:7b-chat-q4_0')
try:
    ollama_client = ollama.Client(host=OLLAMA_HOST)
    # Ensure model is available
    ollama_client.show(OLLAMA_MODEL)
except Exception as e:
    print(f"Error initializing Ollama: {e}")
    ollama_client = None

# MongoDB setup
client = MongoClient(os.getenv("MONGO_DB_URI"))
db = client["ecommerce"]
collections = ["products", "products2"]

# Sentence Transformer for embeddings
encoder = SentenceTransformer("all-MiniLM-L6-v2")

# Cache for frequent queries (TTL of 1 hour)
@lru_cache(maxsize=100)
def cached_search(query: str, k: int) -> Tuple[List[Dict], float]:
    """Cache wrapper for search results with time-based invalidation"""
    return perform_vector_search(query, k), datetime.now().timestamp()

def extract_filters(query: str) -> Tuple[float, float]:
    """Extract price and rating filters from query"""
    price_filter = float('inf')
    rating_filter = 0.0

    price_match = re.search(r"under\s?\$?(\d+\.?\d*)", query.lower())
    if price_match:
        price_filter = float(price_match.group(1))

    rating_match = re.search(r"(?:rating|rated)\s?(?:over|above|>)?\s?(\d+\.?\d*)", query.lower())
    if rating_match:
        rating_filter = float(rating_match.group(1))

    return rating_filter, price_filter

def clean_image_url(image_url: str) -> str:
    """Clean and validate image URLs"""
    if isinstance(image_url, str):
        if image_url.startswith('['):
            try:
                parsed = json.loads(image_url)
                if isinstance(parsed, list) and parsed:
                    return parsed[0]
            except json.JSONDecodeError:
                pass
        return image_url
    return ""

def initialize_system() -> Tuple[Optional[faiss.Index], List[Dict]]:
    """Initialize the search system with products from MongoDB"""
    all_products = []
    
    for collection_name in collections:
        try:
            collection = db[collection_name]
            projection = {
                "title": 1, "description": 1, "product_description": 1,
                "rating": 1, "final_price": 1, "image_url": 1, "image": 1,
                "asin": 1, "sku": 1, "embedding": 1, "url": 1, "_id": 0
            }
            collection_products = list(collection.find({}, projection))
            
            if not collection_products:
                print(f"Warning: No products in {collection_name}")
                continue

            processed = process_products(collection_products, collection_name)
            all_products.extend(processed)
            
        except Exception as e:
            print(f"Error loading {collection_name}: {str(e)}")
            continue

    if not all_products:
        print("Error: No products with embeddings found")
        return None, []

    try:
        embeddings = np.array([p["embedding"] for p in all_products], dtype="float32")
        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)
        return index, all_products
    except Exception as e:
        print(f"Error creating FAISS index: {str(e)}")
        return None, []

def process_products(products: List[Dict], collection_name: str) -> List[Dict]:
    """Process and normalize product data"""
    processed = []
    for p in products:
        try:
            # Normalize fields
            p["source_collection"] = collection_name
            p["rating"] = float(p.get("rating", 0))
            p["final_price"] = float(str(p.get("final_price", 0)).replace('"', ''))
            
            # Handle descriptions
            p["description"] = p.get("description") or p.get("product_description", "")
            
            # Handle images
            p["image_url"] = clean_image_url(p.get("image_url") or p.get("image", ""))
            
            # Handle IDs
            p["product_id"] = p.get("asin") or p.get("sku", "")
            
            if "embedding" in p:
                processed.append(p)
        except Exception as e:
            print(f"Error processing product: {str(e)}")
            continue
    return processed

def perform_vector_search(query: str, k: int = 5) -> List[Dict]:
    """Perform vector similarity search"""
    if not hasattr(perform_vector_search, 'index') or not hasattr(perform_vector_search, 'products'):
        perform_vector_search.index, perform_vector_search.products = initialize_system()
    
    if perform_vector_search.index is None:
        return []

    try:
        query_embedding = encoder.encode([query])[0]
        distances, indices = perform_vector_search.index.search(
            np.array([query_embedding], dtype="float32"), k
        )

        results = []
        min_rating, max_price = extract_filters(query)
        
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(perform_vector_search.products):
                continue

            product = perform_vector_search.products[idx]
            
            # Apply filters
            if product["rating"] < min_rating or product["final_price"] > max_price:
                continue

            results.append({
                "title": product.get("title", ""),
                "description": product.get("description", ""),
                "price": product["final_price"],
                "rating": product["rating"],
                "image_url": product.get("image_url", ""),
                "product_id": product.get("product_id", ""),
                "url": product.get("url", ""),
                "similarity_score": float(distances[0][i]),
                "source": product.get("source_collection", "")
            })

        return results[:k]
    except Exception as e:
        print(f"Search error: {str(e)}")
        return []

def generate_prompt(query: str, products: List[Dict]) -> str:
    """Generate RAG prompt with product context"""
    product_context = "\n\n".join(
        f"Product {i+1}:\n"
        f"Title: {p['title']}\n"
        f"Description: {p['description']}\n"
        f"Price: ${p['price']:.2f}\n"
        f"Rating: {p['rating']}/5\n"
        f"URL: {p['url']}"
        for i, p in enumerate(products)
    )
    return f"""You are an e-commerce assistant. Answer the user's question using ONLY the product information below.
If you don't know the answer, say "I couldn't find that information."

Question: {query}

Available Products:
{product_context}

Answer the question concisely and include relevant product details. Mention prices and ratings when appropriate:"""

# Initialize system
perform_vector_search.index, perform_vector_search.products = initialize_system()

@app.route("/search", methods=["POST"])
def search_products():
    """Vector search endpoint"""
    try:
        data = request.get_json()
        query = data.get("query", "").strip()
        k = min(int(data.get("k", 10)), 50)  # Limit to 50 results max
        
        if not query:
            return jsonify({"error": "Empty query"}), 400

        # Check cache first
        cache_key = (query.lower(), k)
        cached_results, timestamp = cached_search(*cache_key)
        
        # Invalidate cache after 1 hour
        if datetime.now().timestamp() - timestamp > 3600:
            cached_search.cache_clear()
            cached_results = perform_vector_search(query, k)

        return jsonify({
            "products": sorted(cached_results, key=lambda x: x["similarity_score"], reverse=True),
            "count": len(cached_results)
        })

    except Exception as e:
        print(f"Search error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/ask", methods=["POST"])
def rag_endpoint():
    """RAG endpoint with LLM generation"""
    try:
        data = request.get_json()
        query = data.get("query", "").strip()
        
        if not query:
            return jsonify({"error": "Empty question"}), 400

        if not ollama_client:
            return jsonify({"error": "LLM service unavailable"}), 503

        # Get relevant products
        products = perform_vector_search(query, k=5)
        if not products:
            return jsonify({
                "answer": "I couldn't find any relevant products.",
                "products": []
            })

        # Generate LLM response
        prompt = generate_prompt(query, products)
        response = ollama_client.generate(
            model=OLLAMA_MODEL,
            prompt=prompt,
            options={
                'temperature': 0.3,
                'num_ctx': 4096,
                'top_k': 40,
                'top_p': 0.9
            }
        )

        return jsonify({
            "answer": response['response'].strip(),
            "products": products,
            "model": OLLAMA_MODEL,
            "prompt": prompt if os.getenv("DEBUG") else None
        })

    except Exception as e:
        print(f"RAG error: {str(e)}")
        return jsonify({"error": "Failed to generate answer"}), 500

@app.route("/models", methods=["GET"])
def available_models():
    """List available Ollama models"""
    try:
        if not ollama_client:
            return jsonify({"error": "Ollama not available"}), 503
            
        models = ollama_client.list()
        return jsonify({
            "models": [m['name'] for m in models.get('models', [])],
            "current_model": OLLAMA_MODEL
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """System health check"""
    status = {
        "database": "ok" if client and db else "disconnected",
        "vector_index": "ok" if hasattr(perform_vector_search, 'index') else "uninitialized",
        "llm": "ok" if ollama_client else "disconnected",
        "product_count": len(perform_vector_search.products) if hasattr(perform_vector_search, 'products') else 0,
        "status": "healthy"
    }
    return jsonify(status)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)), debug=os.getenv("DEBUG", "false").lower() == "true")