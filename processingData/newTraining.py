import json
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from gensim.models import Word2Vec
import string

# Download necessary NLTK resources
nltk.download('punkt')
nltk.download('stopwords')

# Load JSON data
with open("structured_training_data.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Preprocess text: tokenize, remove punctuation & stopwords
stop_words = set(stopwords.words('english'))

def preprocess_text(text):
    tokens = word_tokenize(text.lower())  # Convert to lowercase and tokenize
    tokens = [word for word in tokens if word not in stop_words and word not in string.punctuation]  # Remove stopwords & punctuation
    return tokens

# Extract text from JSON and tokenize
sentences = []
for item in data:
    if "description" in item:
        sentences.append(preprocess_text(item["description"]))

# Ensure sentences are not empty before training
if len(sentences) == 0:
    raise ValueError("No valid sentences found in the dataset!")

# Train Word2Vec model properly
word2vecModel = Word2Vec(vector_size=100, window=5, min_count=1, workers=4)
word2vecModel.build_vocab(sentences)  # Build vocabulary first
word2vecModel.train(sentences, total_examples=len(sentences), epochs=10)  # Now train the model

# Save model
word2vecModel.save("word2vec_product_model.model")
print("Model training completed and saved!")
