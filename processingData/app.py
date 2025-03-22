from flask import Flask, request, jsonify
import json
import numpy as np
import pandas as pd
import string
import os

from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from gensim.models import Word2Vec
from pinecone import Pinecone
from flask_cors import CORS



PINECONE_API_KEY = "pcsk_5BoCaa_7KFxqRG8hCmz6A4HUvFDJqSK4drKjfo4C7kXpG8oyjZpqAVDwDi4RQHEN9hS1Xq"

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY is not set in the .env file")

# ✅ Initialize Flask
app = Flask(__name__)
CORS(app)
# ✅ Load Product Data
with open("structured_training_data.json", "rb") as f:
    data = json.load(f)

df = pd.DataFrame(data)

# ✅ Text Preprocessing (Tokenization, Stopwords Removal, Lemmatization)
stopWords = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def preprocessText(text):
    words = word_tokenize(text.lower())  # Lowercase & tokenize
    words = [lemmatizer.lemmatize(word) for word in words if word not in stopWords and word not in string.punctuation]
    return words

df["TokenizedName"] = df["Name"].apply(preprocessText)

# ✅ Train Word2Vec Model on Product Names (If not already trained)
word2vecModel = Word2Vec(sentences=df["TokenizedName"], vector_size=768, window=5, min_count=1, workers=4)
word2vecModel.save("word2vec_product_model.model")  # Save the model

# ✅ Load the Word2Vec Model
word2vecModel = Word2Vec.load("word2vec_product_model.model")  # Load the model

# ✅ Convert Product Names to Vector Embeddings
def get_product_embedding(product_name, model):
    words = preprocessText(product_name)  # Tokenize & process
    word_vectors = [model.wv[word] for word in words if word in model.wv]

    if word_vectors:
        return np.mean(word_vectors, axis=0)  # Return average vector
    else:
        return np.zeros(model.vector_size)  # Return zero vector if no match

df["VectorEmbedding"] = df["Name"].apply(lambda name: get_product_embedding(name, word2vecModel))

# ✅ Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)

index_name = "product-index"

index = pc.Index(index_name)

# ✅ Process User Query
def get_query_embedding(query, model):
    words = preprocessText(query)
    word_vectors = [model.wv[word] for word in words if word in model.wv]

    if word_vectors:
        return np.mean(word_vectors, axis=0)
    else:
        return np.zeros(model.vector_size)

@app.route('/generate', methods=['POST'])
def search_products():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "No query provided"}), 400

        query_embedding = get_query_embedding(query, word2vecModel)

        # ✅ Perform Similarity Search in Pinecone
        search_results = index.query(
            namespace="product-namespace",
            vector=query_embedding.tolist(),
            top_k=7,
            include_metadata=True
        )

        # ✅ Process and return top 5 Similar Products
        response = []
        for match in search_results["matches"]:
            product_info = {
                "ProductID": match["id"],
                "SimilarityScore": match["score"],
                "ProductName": match["metadata"]["Name"],
                "Price": match["metadata"]["UnitPrice"],
                "Rating": match["metadata"]["AvgRating"],
                "ImageURL": match["metadata"].get("ImageURL", "No Image Available"),
                "Description": match["metadata"].get("Description", "No Description Available")
            }
            response.append(product_info)

        return jsonify({"response": response})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
