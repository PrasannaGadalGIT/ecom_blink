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

nlp = spacy.load("en_core_web_sm")
load_dotenv()

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_DB_URI"))
db = client["ecommerce"]
collections = ["products", "products2"]

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

def clean_image_url(image_url):
    if isinstance(image_url, str) and image_url.startswith('['):
        try:
            parsed = json.loads(image_url)
            if isinstance(parsed, list) and parsed:
                return parsed[0]  # return the first valid URL
        except json.JSONDecodeError:
            pass
    return image_url  # fallback to original

def initialize_system():
    all_products = []

    for collection_name in collections:
        collection_products = list(db[collection_name].find({}, {
            "title": 1, "description": 1, "product_description": 1, "categories": 1,
            "rating": 1, "final_price": 1, "image_url": 1, "image": 1,
            "asin": 1, "sku": 1, "embedding": 1, "url": 1
        }))

        for product in collection_products:
            product["source_collection"] = collection_name

            if "rating" in product:
                try:
                    product["rating"] = float(product["rating"])
                except (ValueError, TypeError):
                    product["rating"] = 0.0
            else:
                product["rating"] = 0.0

            if "final_price" in product:
                try:
                    product["final_price"] = float(str(product["final_price"]).strip('"'))
                except (ValueError, TypeError):
                    product["final_price"] = 0.0
            else:
                product["final_price"] = 0.0

            if "description" not in product and "product_description" in product:
                product["description"] = product["product_description"]

            if "image_url" not in product and "image" in product:
                product["image_url"] = product["image"]

            product["image_url"] = clean_image_url(product.get("image_url", ""))

            if "asin" not in product and "sku" in product:
                product["asin"] = product["sku"]

        all_products.extend(collection_products)

    valid_products = []
    embeddings = []

    for p in all_products:
        if "embedding" in p:
            embeddings.append(p["embedding"])
            valid_products.append(p)

    if not embeddings:
        print("Warning: No embeddings found in the collections")
        return None, []

    embeddings = np.array(embeddings, dtype="float32")
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    return index, valid_products

index, products = initialize_system()

@app.route("/search", methods=["POST"])
def search_products():
    try:
        data = request.json
        query = data.get("query", "").strip()
        k = int(data.get("k", 10)) * 3

        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400

        if index is None:
            return jsonify({"error": "Search index could not be initialized"}), 500

        min_rating, max_price = extract_filters(query)

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
            if idx < 0 or idx >= len(products):
                continue

            product = products[idx]
            title = product.get('title', '')
            description = product.get('description', '')
            title_desc = f"{title} {description}".lower()

            if product["rating"] >= min_rating and product["final_price"] <= max_price:
                adjective_matches = sum(
                    1 for adj in keywords["adjectives"] if adj in title_desc
                )
                boosted_score = float(distances[0][i]) * (1 + 0.1 * adjective_matches)

                results.append({
                    "title": title,
                    "description": description,
                    "price": product["final_price"],
                    "rating": product["rating"],
                    "image_url": product.get("image_url", ""),
                    "similarity_score": boosted_score,
                    "product_id": product.get("asin", ""),
                    "url": product.get("url", ""),
                    "source_collection": product.get("source_collection", "")
                })

                if len(results) >= k // 3:
                    break

        return jsonify({
            "products": sorted(results, key=lambda x: x["similarity_score"], reverse=True),
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
