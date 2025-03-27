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
nlp = spacy.load("en_core_web_sm")

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Connection
client = MongoClient(os.getenv("MONGO_DB_URI"))
db = client["ecommerce"]

encoder = SentenceTransformer("all-MiniLM-L6-v2")

def extract_filters(query):
    price_filter = None
    rating_filter = None

   
    price_match = re.search(r"under\s?\$?(\d+\.?\d*)", query.lower())
    if price_match:
        price_filter = float(price_match.group(1))  

  
    rating_match = re.search(r"rating\s?under\s?(\d+\.?\d*)", query.lower())
    if rating_match:
        rating_filter = float(rating_match.group(1))  

    
    if rating_filter is None:
        rating_filter = 0  
    if price_filter is None:
        price_filter = float("inf")  

    return rating_filter, price_filter


def initialize_system():
    products = list(db.products.find({}, {
        "title": 1, "description": 1, "categories": 1,
        "rating": 1, "final_price": 1, "image_url": 1,
        "asin": 1, "embedding": 1, "url": 1
    }))

    for product in products:
        product["rating"] = float(product["rating"])
        product["final_price"] = float(str(product["final_price"]).strip('"'))

    embeddings = []
    for p in products:
        if "embedding" in p:
            embeddings.append(p["embedding"])
    embeddings = np.array(embeddings, dtype="float32")

    index = faiss.IndexFlatIP(embeddings.shape[1])  
    index.add(embeddings)

    return index, products

index, products = initialize_system()

@app.route("/search", methods=["POST"])
def search_products():
    try:
        data = request.json
        query = data.get("query", "").strip()
        k = int(data.get("k", 10)) * 3  

        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400

        # Extract filters (price and rating) from the query
        min_rating, max_price = extract_filters(query)

        # Extract keywords for boosting
        doc = nlp(query)
        nouns = []
        adjectives = []

        for token in doc:
            if token.pos_ == "NOUN":
                nouns.append(token.text.lower())
            elif token.pos_ == "ADJ":
                adjectives.append(token.text.lower())
        keywords = {
            "nouns": nouns,
            "adjectives": adjectives
        }

      
        query_embedding = encoder.encode([query])[0]
        distances, indices = index.search(np.array([query_embedding], dtype="float32"), k)

        results = []
        for i, idx in enumerate(indices[0]):
            product = products[idx]

            # Apply the min_rating and max_price filters
            if product["rating"] >= min_rating and product["final_price"] <= max_price:
                title_desc = f"{product['title']} {product['description']}".lower()
                adjective_matches = sum(
                    1 for adj in keywords["adjectives"] if adj in title_desc
                )
                boosted_score = float(distances[0][i]) * (1 + 0.1 * adjective_matches)

                results.append({
                    "title": product["title"],
                    "description": product["description"],
                    "price": product["final_price"],
                    "rating": product["rating"],
                    "image_url": product["image_url"],
                    "similarity_score": boosted_score,
                    "product_id": product["asin"],
                    "url": product.get("url", "")
                })

                if len(results) >= k // 3:  
                    break

        return jsonify({
            "products": sorted(results, key=lambda x: x["similarity_score"], reverse=True),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)