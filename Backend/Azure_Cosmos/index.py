from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pymongo import MongoClient
import numpy as np
import os
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer



# Define connection string
connection_string = "mongodb+srv://rrtcosmos:P%40ssw0rd%40001@aipocrag.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000"




# Function to connect to MongoDB
def get_client(connection_string):
    try:
        client = MongoClient(connection_string, tls=True, tlsAllowInvalidCertificates=True)
        return client
    except Exception as e:
        print(f"An error occurred while connecting to MongoDB: {e}")
        return None

# Function to get a collection
def get_collection(collection_name):
    try:
        my_client = get_client(connection_string)
        collection = my_client["rag_db"][collection_name]
        return collection
    except Exception as e:
        raise Exception(f"Error getting collection: {str(e)}")

# Generate embeddings for text
def generate_embedding(data):
    model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)
    try:
        embedding = model.encode(data)
        return embedding.tolist()
    except Exception as e:
        raise Exception(f"Error generating embedding: {str(e)}")

# Function to calculate cosine similarity
def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

# Function to process files and upload to MongoDB
def process_and_upload_files(file_paths,  collection_name):
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
    collection = get_collection(collection_name)
    try:
        result = collection.insert_many(documents_to_insert)
        return {"inserted_ids": result.inserted_ids}
    except Exception as e:
        return {"error": str(e)}

# Function to query documents based on cosine similarity
def query_documents(query, collection_name, top_k=5):
    # Connect to MongoDB
    collection = get_collection(collection_name)

    # Fetch all documents
    documents = list(collection.find({}, {"_id": 0, "text": 1, "embedding": 1}))

    if not documents:
        raise ValueError("No documents found in the collection.")

    # Generate query embedding
    query_embedding = generate_embedding(query)

    # Calculate cosine similarity for each document
    similarities = []
    for doc in documents:
        similarity = cosine_similarity(query_embedding, doc["embedding"])
        similarities.append((doc, similarity))

    # Sort by similarity and get top_k results
    top_results = sorted(similarities, key=lambda x: x[1], reverse=True)[:top_k]

    # Return results
    return [{"text": result[0]["text"], "similarity": result[1]} for result in top_results]

def upload_files_data_mongo_api():
    if not request.content_type.startswith('multipart/form-data'):
        return jsonify({"error": "Unsupported Media Type. Content-Type must be 'multipart/form-data'"}), 415
    try:
        if 'files' not in request.files:
            return "No files provided", 400
        collection_name = request.form.get('collection_name')
        files = request.files.getlist('files')
        result = upload_file_to_mongo_db(files, 'mongodb/uploads', collection_name)
        return jsonify({"message": f"Data inserted successfully for {collection_name}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def upload_file_to_mongo_db(files, upload_path, collection_name):
    file_paths = []
    for file in files:
        file_path = os.path.join(upload_path, file.filename)
        file.save(file_path)
        file_paths.append(file_path)
    return process_and_upload_files(file_paths, collection_name)


def index_collextion_mongo_api():
    if not request.is_json:
        return jsonify({"error": "Unsupported Media Type. Content-Type must be 'application/json'"}), 415
    data = request.get_json()
    query_text = data.get('query_text')
    if not query_text:
        raise ValueError("Invalid input: 'query_text' must not be None or empty.")
    
    collection_name = data.get('collection_name')
    top_k = data.get('top_k', 5)
    result = query_documents(query_text,  collection_name, top_k)
    return jsonify(result)
def delete_collection_mongo_api():
    if not request.is_json:
        return jsonify({"error": "Unsupported Media Type. Content-Type must be 'application/json'"}), 415
    data = request.get_json()
def delete_collection_mongo_api():
    data = request.json
    
    collection_name = data.get('collection_name')
    collection = get_collection(collection_name)
    result = collection.drop()
    return jsonify({"result": "Collection deleted"})


def list_all_index_api():
    data = request.args
    
    client = get_client(connection_string)
    
    # Assuming you want to list all collections in the database
    db = client["rag_db"]
    collections = db.list_collection_names()
    return jsonify({"collections": collections})
    



def get_query_results_mongo_api():
    data = request.json
    query_text = data.get('query')
    collection_name = data.get('collection_name')
    top_k = data.get('top_k', 5)
    result = query_documents(query_text,  collection_name, 5)
    formatted_results = {
        "results": [
            {
                "doc_name": doc["similarity"],
                "page_number": "unknown",
                "text": doc["text"]
            }
            for doc in result
        ]
    }
    return jsonify(formatted_results)


def render_cosmos_pack(app):
    app.add_url_rule('/upload-collection-doc-mongo', 'upload_files_data_mongo', upload_files_data_mongo_api, methods=['POST'])
    app.add_url_rule('/indexing-mongo', 'index_collextion_mongo', index_collextion_mongo_api, methods=['POST'])
    app.add_url_rule('/delete-collection', 'delete_collection_mongo', delete_collection_mongo_api, methods=['POST'])
    app.add_url_rule('/list-index-mongo', 'list_all_index', list_all_index_api, methods=['GET'])
    app.add_url_rule('/get-context-mongo', 'get_query_results_mongo', get_query_results_mongo_api, methods=['POST'])
    return app
