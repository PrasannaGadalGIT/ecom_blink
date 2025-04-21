import pandas as pd
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import json
import ast
from tqdm import tqdm  # for progress bar

# Initialize the embedding model (384 dimensions)
model = SentenceTransformer('all-MiniLM-L6-v2')  # This model outputs 384-dim embeddings

# MongoDB connection setup
def get_mongodb_collection(connection_string, db_name, collection_name):
    client = MongoClient(connection_string)
    db = client[db_name]
    return db[collection_name]

def process_csv_to_mongodb(csv_path, mongodb_uri, db_name, collection_name, batch_size=100):
    # Read CSV file
    df = pd.read_csv(csv_path)
    
    # Connect to MongoDB
    collection = get_mongodb_collection(mongodb_uri, db_name, collection_name)
    
    # Process in batches to handle large files
    for i in tqdm(range(0, len(df), batch_size), desc="Processing batches"):
        
        batch = df.iloc[i:i+batch_size]
        documents = []

        for _, row in batch.iterrows():
            doc = row.to_dict()
            
            # Robust parse and structure for image field
            if 'image' in doc and doc['image']:
                try:
                    if isinstance(doc['image'], list):
                        image_list = doc['image']
                    elif isinstance(doc['image'], str):
                        cleaned_str = doc['image'].strip('"\'')
                        if cleaned_str.startswith('[') and cleaned_str.endswith(']'):
                            try:
                                image_list = json.loads(cleaned_str)
                            except json.JSONDecodeError:
                                try:
                                    fixed_str = cleaned_str.replace('\\"', '"')
                                    image_list = json.loads(fixed_str)
                                except json.JSONDecodeError:
                                    try:
                                        image_list = ast.literal_eval(cleaned_str)
                                    except (SyntaxError, ValueError):
                                        urls = cleaned_str.strip('[]').split(',')
                                        image_list = [url.strip(' "\'').replace('\\"', '"') for url in urls if url.strip()]
                        else:
                            image_list = [cleaned_str]
                    else:
                        image_list = [str(doc['image'])]

                    doc['image_list'] = image_list
                    doc['image_url'] = image_list[0] if image_list else ""
                except Exception as e:
                    print(f"Error parsing image field: {e}")
                    doc['image_list'] = []
                    doc['image_url'] = ""
            else:
                doc['image_list'] = []
                doc['image_url'] = ""

            # Combine relevant text fields for embedding
            title = doc.get('title', '')
            product_description = doc.get('product_description', '')
            combined_text = f"{title} {product_description}"

            if not combined_text.strip():
                print(f"Skipping document with no text to embed: {doc.get('title', 'no title')}")
                continue
            
            # Generate embedding
            embedding = model.encode(combined_text, convert_to_tensor=False).tolist()
            doc['embedding'] = embedding

            documents.append(doc)
        
        # Insert batch into MongoDB
        if documents:
            try:
                collection.insert_many(documents)
                print(f"Inserted batch {i//batch_size + 1} with {len(documents)} documents")
            except Exception as e:
                print(f"Error inserting batch: {e}")
    
    print(f"Successfully processed {len(df)} records into MongoDB")

# Example usage
if __name__ == "__main__":
    process_csv_to_mongodb(
        csv_path='lazada-products.csv',
        mongodb_uri='mongodb+srv://prasannagadal:Petrucci12@cluster0.vlqp8.mongodb.net/',
        db_name='ecommerce',
        collection_name='products2'
    )
