from flask import Flask, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from flask_cors import CORS
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MongoDB Connection
client = MongoClient(os.getenv("MONGO_DB_URI"))
db = client["ecommerce"]

encoder = SentenceTransformer("all-MiniLM-L6-v2")


gpt_model = GPT2LMHeadModel.from_pretrained("gpt2")
gpt_tokenizer = GPT2Tokenizer.from_pretrained("gpt2")


def initialize_system():
    products = list(db.products.find({}, {
        "title": 1, "description": 1, "categories": 1,
        "rating": 1, "final_price": 1, "image_url": 1,
        "asin": 1, "embedding": 1
    }))

    
    for product in products:
        product["rating"] = float(product["rating"])
        product["final_price"] = float(str(product["final_price"]).strip('"'))

    embeddings = np.array([p["embedding"] for p in products if "embedding" in p], dtype="float32")

    if embeddings.shape[0] == 0:
        raise ValueError("No valid embeddings found in MongoDB")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    return index, products

index, products = initialize_system()


def generate_response(products):
    product_names = [product["title"] for product in products]

    

    # Interactive chat prompt
    chat_prompt = (
        "Great choices! 😊 Are you looking for something specific today? "
        "Do you have any preferences, like brand or budget? I'm happy to help!"
    )

    inputs = gpt_tokenizer.encode(chat_prompt, return_tensors="pt")
    outputs = gpt_model.generate(inputs, max_length=200, num_return_sequences=1)
    response = gpt_tokenizer.decode(outputs[0], skip_special_tokens=True)

    return f"\n\n{response}"

# API Route for Product Search
@app.route("/search", methods=["POST"])
def search_products():
    try:
        data = request.json
        query = data.get("query", "").strip()
        min_rating = float(data.get("min_rating", 0))
        max_price = float(data.get("max_price", float("inf")))
        k = int(data.get("k", 10)) * 3  
    
        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400

        # Encode Query
        query_embedding = encoder.encode([query])[0]
        distances, indices = index.search(np.array([query_embedding], dtype="float32"), k)

        results = []
        for i, idx in enumerate(indices[0]):
            product = products[idx]

           
            if product["rating"] >= min_rating and product["final_price"] <= max_price:
                results.append({
                    "title": product["title"],
                    "description": product["description"],
                    "price": product["final_price"],
                    "rating": product["rating"],
                    "image_url": product["image_url"],
                    "similarity_score": float(distances[0][i]),
                    "product_id": product["asin"]
                })

                if len(results) >= k // 3:  
                    break

       
      

       
        return jsonify({
            "products": sorted(results, key=lambda x: x["similarity_score"], reverse=True),
            
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run Flask App
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
