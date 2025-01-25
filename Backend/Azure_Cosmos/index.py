import google.generativeai as genai
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import aerospike
import numpy as np
import os
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

# Aerospike configuration
AEROSPIKE_CONFIG = {
    'hosts': [('127.0.0.1', 3000)],  # Replace with your Aerospike server details
}

# Configure GenAI API
genai.configure(api_key="")

# Connect to Aerospike
def get_aerospike_client():
    try:
        client = aerospike.client(AEROSPIKE_CONFIG).connect()
        print("Connected to Aerospike!")
        return client
    except aerospike.exception.ClientError as e:
        print(f"Failed to connect to Aerospike: {e}")
        raise

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

# Function to process files and upload to Aerospike
def process_and_upload_files(file_paths, namespace, set_name):
    if not file_paths:
        raise ValueError("No file paths provided.")

    # Prepare for processing
    client = get_aerospike_client()
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
        for idx, doc in enumerate(split_docs):
            key = (namespace, set_name, f"doc_{idx}")
            record = {
                "text": doc.page_content,
                "embedding": generate_embedding(doc.page_content),
                "page_number": doc.metadata.get("page", None),
                "source": doc.metadata.get("source", None),
            }
            documents_to_insert.append((key, record))

    # Insert into Aerospike
    try:
        for key, record in documents_to_insert:
            client.put(key, record)
        print("Documents uploaded successfully!")
    except aerospike.exception.AerospikeError as e:
        print(f"Error inserting documents: {e}")
    finally:
        client.close()

# Function to query documents based on cosine similarity
def query_documents(query, namespace, set_name, top_k=5):
    namespace = "test"
    client = get_aerospike_client()
    try:
        # Generate query embedding
        query_embedding = generate_embedding(query)
        print("=================", query_embedding)

        # Scan all records in the set
        scan = client.scan(namespace, set_name)
        documents = []

        def process_record(record):
            documents.append({
                "text": record[2].get("text"),
                "embedding": record[2].get("embedding")
            })

        scan.foreach(process_record)

        if not documents:
            raise ValueError("No documents found in the Aerospike set.")

        # Calculate cosine similarity for each document
        similarities = []
        for doc in documents:
            similarity = cosine_similarity(query_embedding, doc["embedding"])
            similarities.append((doc, similarity))

        # Sort by similarity and get top_k results
        top_results = sorted(similarities, key=lambda x: x[1], reverse=True)[:top_k]

        # Return results
        return [{"text": result[0]["text"], "similarity": result[1]} for result in top_results]
    except aerospike.exception.AerospikeError as e:
        print(f"Error querying Aerospike: {e}")
        return []
    finally:
        client.close()

def upload_files_data_mongo_api():
    if not request.content_type.startswith('multipart/form-data'):
        return jsonify({"error": "Unsupported Media Type. Content-Type must be 'multipart/form-data'"}), 415
    try:
        if 'files' not in request.files:
            return "No files provided", 400
        collection_name = request.form.get('collection_name')
        files = request.files.getlist('files')
        result = upload_file_to_aerospike(files, 'aerospike/uploads', collection_name)
        return jsonify({"message": f"Data inserted successfully for {collection_name}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def upload_file_to_aerospike(files, upload_path, collection_name):
    file_paths = []
    for file in files:
        file_path = os.path.join(upload_path, file.filename)
        file.save(file_path)
        file_paths.append(file_path)
    return process_and_upload_files(file_paths, collection_name, 'rrt')


def index_collextion_mongo_api():
    if not request.is_json:
        return jsonify({"error": "Unsupported Media Type. Content-Type must be 'application/json'"}), 415
    data = request.get_json()
    query_text = data.get('query_text')
    if not query_text:
        raise ValueError("Invalid input: 'query_text' must not be None or empty.")
    
    collection_name = data.get('collection_name')
    top_k = data.get('top_k', 5)
    result = query_documents(query_text,  collection_name, collection_name, top_k)
    return jsonify(result)

def delete_collection_mongo_api():
    if not request.is_json:
        return jsonify({"error": "Unsupported Media Type. Content-Type must be 'application/json'"}), 415
    data = request.get_json()
    
    collection_name = data.get('collection_name')
    client = get_aerospike_client()
    try:
        # Deleting the collection in Aerospike (in Aerospike, we can delete records, not collections)
        scan = client.scan('test', collection_name)
        scan.foreach(lambda record: client.remove(record[0]))
        return jsonify({"result": "Collection deleted successfully"})
    except aerospike.exception.AerospikeError as e:
        return jsonify({"error": f"Error deleting collection: {e}"}), 500
    finally:
        client.close()


def list_all_index_api():
    client = get_aerospike_client()
    try:
        # Fetch all sets information from Aerospike
        sets_info = client.info_all('sets')
        
        # Extract set names from the response
        set_names = []
        for node, info in sets_info.items():
            if not info or not isinstance(info, tuple):
                continue  # Skip if info is None or not a tuple
            
            # Decode the response (if it's bytes) and process it
            info_str = info[1].decode("utf-8") if isinstance(info[1], bytes) else info[1]
            for line in info_str.split("\n"):
                if line.startswith("set"):
                    for part in line.split(";"):
                        if part.startswith("set="):
                            set_name = part.split("=", 1)[1].strip()
                            if set_name not in set_names:
                                set_names.append(set_name)
        
        return jsonify({"collections": set_names})
    
    except aerospike.exception.AerospikeError as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        client.close()




def get_query_results_mongo_api():
    data = request.json
    query_text = data.get('query')
    collection_name = data.get('collection_name')
    top_k = data.get('top_k', 5)
    result = query_documents(query_text, collection_name, "rrt", 5)
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
