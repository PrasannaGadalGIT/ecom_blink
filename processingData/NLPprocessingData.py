import json
import numpy as np
import pandas as pd
import nltk
import string

from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from gensim.models import Word2Vec
from pinecone import Pinecone, ServerlessSpec
from scipy.spatial.distance import cosine

# ✅ Download Required NLTK Data
nltk.download('punkt')
nltk.download("stopwords")
nltk.download('wordnet')

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

# ✅ Train Word2Vec Model on Product Names
word2vecModel = Word2Vec(sentences=df["TokenizedName"], vector_size=768, window=5, min_count=1, workers=4)
word2vecModel.save("word2vec_product_model.model")  # Save the model

# ✅ Load the Word2Vec Model (Updated Section)
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
pc = Pinecone(api_key="pcsk_5BoCaa_7KFxqRG8hCmz6A4HUvFDJqSK4drKjfo4C7kXpG8oyjZpqAVDwDi4RQHEN9hS1Xq")

index_name = "product-index"

# # ✅ Create Index if Not Exists (Updated dimension to match Word2Vec vector size)
# if index_name not in pc.list_indexes():
#     pc.create_index(
#         name=index_name,
#         dimension=100,  # Match Word2Vec embedding size (100 instead of 768)
#         metric="cosine",
#         spec=ServerlessSpec(cloud="aws", region="us-east-1")
#     )

index = pc.Index(index_name)

# ✅ Upsert Product Data into Pinecone
# upsert_data = [
#     {
#         "id": str(row['ProductID']),
#         "values": row['VectorEmbedding'].tolist(),
#         "metadata": {
#             "Name": row["Name"],
#             "UnitPrice": row["UnitPrice"],
#             "AvgRating": row["AvgRating"]
#         }
#     }
#     for _, row in df.iterrows()
# ]

# index.upsert(vectors=upsert_data, namespace="product-namespace")

# ✅ Process User Query
query = "I was searching for affordable camera "
query_tokens = preprocessText(query)

# ✅ Convert Query into Vector Embedding
def get_query_embedding(query, model):
    words = preprocessText(query)
    word_vectors = [model.wv[word] for word in words if word in model.wv]

    if word_vectors:
        return np.mean(word_vectors, axis=0)
    else:
        return np.zeros(model.vector_size)


query_embedding = get_query_embedding(query, word2vecModel)

# ✅ Perform Similarity Search in Pinecone
search_results = index.query(
    namespace="product-namespace",
    vector=query_embedding.tolist(),
    top_k=5,
    include_metadata=True
)

# ✅ Display Top 5 Similar Products
for match in search_results["matches"]:
    print(f"Product ID: {match['id']}, Similarity Score: {match['score']}")
    print(f"Product Name: {match['metadata']['Name']}, Price: ${match['metadata']['UnitPrice']}\n")
