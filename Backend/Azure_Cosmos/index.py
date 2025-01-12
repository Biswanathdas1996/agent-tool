import google.generativeai as genai
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pymongo import MongoClient
import numpy as np
import os
 
 
genai.configure(api_key="")
 
# Function to connect to MongoDB
def get_mongo_collection(database_name, collection_name, connection_string):
    client = MongoClient(connection_string)
    return client[database_name][collection_name]
 
 
# Generate embeddings for text
def generate_embedding(text):
    response = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return response["embedding"]  
 
 
# Function to calculate cosine similarity
def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
 
# Function to process files and upload to MongoDB
def process_and_upload_files(file_paths, db_name, collection_name, connection_string):
    if not file_paths:
        raise ValueError("No file paths provided.")
 
    # Prepare for processing
    documents_to_insert = []
 
    # Process each file
    for path in file_paths:
        if os.path.exists(path) and os.path.getsize(path) > 0:
            loader = PyPDFLoader(path)
            documents = loader.load()
        else:
            raise FileNotFoundError(f"File {path} not found or empty.")
       
        # Split text into smaller chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=20)
        split_docs = text_splitter.split_documents(documents)
 
        # Prepare documents for insertion
        for doc in split_docs:
            documents_to_insert.append({
                "text": doc.page_content,
                "embedding": generate_embedding(doc.page_content),
                "page_number": doc.metadata.get("page", None),
                "source": doc.metadata.get("source", None),
            })
 
    # Insert into MongoDB
    collection = get_mongo_collection(db_name, collection_name, connection_string)
    try:
        result = collection.insert_many(documents_to_insert)
        return {"inserted_ids": result.inserted_ids}
    except Exception as e:
        return {"error": str(e)}
 
# Function to query documents based on cosine similarity
def query_documents(query, db_name, collection_name, connection_string, top_k=5):
    # Connect to MongoDB
    collection = get_mongo_collection(db_name, collection_name, connection_string)
 
    # Fetch all documents
    documents = list(collection.find({}, {"_id": 0, "text": 1, "embedding": 1}))
 
    if not documents:
        raise ValueError("No documents found in the collection.")
 
    # Generate query embedding
    query_embedding = generate_embedding(query)
    print("=================", query_embedding)
    # Calculate cosine similarity for each document
    similarities = []
    for doc in documents:
        similarity = cosine_similarity(query_embedding, doc["embedding"])
        similarities.append((doc, similarity))
 
    # Sort by similarity and get top_k results
    top_results = sorted(similarities, key=lambda x: x[1], reverse=True)[:top_k]
 
    # Return results
    return [{"text": result[0]["text"], "similarity": result[1]} for result in top_results]
 
 
if __name__ == "__main__":
    file_paths = ["PQC.pdf", "PQC.pdf"]
    db_name = "rag_db"
    collection_name = "test_collection1"
    connection_string = "mongodb+srv://rrtcosmos:P%40ssw0rd%40001@aipocrag.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"
 
    # Upload documents
    upload_result = process_and_upload_files(file_paths, db_name, collection_name, connection_string)
    print("Upload Result:", upload_result)
 
    # Query for similar documents
    query_text = "Profit Maximization"
    top_k_results = query_documents(query_text, db_name, collection_name, connection_string, top_k=5)
    print("\nTop Similar Documents:")
    for result in top_k_results:
        print(f"Text: {result['text']}, Similarity: {result['similarity']:.4f}")
