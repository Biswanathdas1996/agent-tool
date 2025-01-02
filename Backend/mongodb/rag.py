from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pymongo import MongoClient
import os
from pymongo.operations import SearchIndexModel
import time
from flask import Flask, request, jsonify
from mongodb.client import get_Client


def get_collection(index_name):
    
    my_client = get_Client()
    collection = my_client["rag_db"][index_name]
    return collection

# Define a function to generate embeddings
def get_embedding(data, model):
    """Generates vector embeddings for the given data."""

    embedding = model.encode(data)
    return embedding.tolist()


def save_temp_file(files, folder_path):
    if not files:
        return "Got no file for processing"
    file_paths = []
    for file in files:
        # Save file to uploads folder
        file_path = os.path.join(folder_path, file.filename)
        try:
            file.save(file_path)
            file_paths.append(file_path)
        except Exception as e:
            return f"An error occurred while saving the file: {str(e)}"
    return file_paths

        

# file_path = "uploads/30-days-of-react-ebook-fullstackio.pdf"
def upload_file_to_mongo_db(file, save_file_path, index_name):
    file_path = save_temp_file(file, save_file_path)

    for path in file_path:
        if os.path.exists(path) and os.path.getsize(path) > 0:
            loader = PyPDFLoader(path)
            data = loader.load()
        else:
            raise FileNotFoundError(f"File {path} not found or is empty.")
    # Split the data into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=20)
    documents = text_splitter.split_documents(data)
    print(f"Number of documents: {documents}")
    # Prepare documents for insertion
    model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)
    docs_to_insert = [{
        "text": doc.page_content,
        "embedding": get_embedding(doc.page_content, model),
        "page_number": doc.metadata["page"],
        "doc_name": doc.metadata["source"]
    } for doc in documents]


    # Connect to your Atlas cluster
    collection = get_collection(index_name)

    # Insert documents into the collection
    try:
        result = collection.insert_many(docs_to_insert)
        return result
    except Exception as e:
        return f"An error occurred while inserting documents: {str(e)}"
   


def indexing(index_name):
    collection = get_collection(index_name)
    search_index_model = SearchIndexModel(
    definition = {
        "fields": [
        {
            "type": "vector",
            "numDimensions": 768,
            "path": "embedding",
            "similarity": "cosine"
        }
        ]
    },
    name = index_name,
    type = "vectorSearch"
    )
    collection.create_search_index(model=search_index_model)
    print("Polling to check if the index is ready. This may take up to a minute.")
    predicate=None
    if predicate is None:
        predicate = lambda index: index.get("queryable") is True

    while True:
        indices = list(collection.list_search_indexes(index_name))
        if len(indices) and predicate(indices[0]):
            break
        time.sleep(5)
    print(index_name + " is ready for querying.")


def get_query_results(query, index_name, no_of_results= 5):
  """Gets results from a vector search query."""
  model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)
  collection = get_collection(index_name)
  query_embedding = get_embedding(query, model)
  pipeline = [
      {
            "$vectorSearch": {
              "index": index_name,
              "queryVector": query_embedding,
              "path": "embedding",
              "exact": True,
              "limit": no_of_results
            }
      }, {
            "$project": {
              "_id": 0,
              "text": 1,
              "page_number": 1,
              "doc_name": 1
         }
      }
  ]
  results = collection.aggregate(pipeline)
  array_of_results = []
  for doc in results:
      array_of_results.append(doc)
  return array_of_results


def list_indexes():
    collection = get_collection("any")
    indexes = collection.database.list_collection_names()
    print(indexes)
    # indexes = collection.list_indexes()
    return indexes

# ------------------------------------------api ready functions--------------------------------------------



def upload_files_data_mongo_api():
    if 'files' not in request.files:
        return "No files provided", 400
    collection_name = request.form.get('collection_name')
    files = request.files.getlist('files')
    try:
        result = upload_file_to_mongo_db(files,'mongodb/uploads',collection_name)
      
        return jsonify({f"message": "Data inserted successfully for {collection_name}"}), 200 
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


def index_collextion_mongo_api():
    collection_name = request.form.get('collection_name')
    try:
        result = indexing(collection_name)
      
        return jsonify({f"message": "{collection_name} successfully indxed "}), 200 
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


def list_all_index_api():   
    try:
        result = list_indexes()
      
        return jsonify({f"collections": result}), 200 
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    

def get_query_results_mongo_api():
    data = request.get_json()
    query = data.get('query')
    no_of_results = data.get('no_of_results')
    collection_name = data.get('collection_name')
    try:
        result = get_query_results(query,collection_name, no_of_results)

        response_result = {"results": result}

        return jsonify(response_result), 200 
    except Exception as e:
        return jsonify({"error": str(e)}), 500



def render_mongo_pack(app):
    
    app.add_url_rule('/upload-collection-doc-mongo', 'upload_files_data_mongo', upload_files_data_mongo_api, methods=['POST'])
    app.add_url_rule('/indexing-mongo', 'index_collextion_mongo', index_collextion_mongo_api, methods=['POST'])
    app.add_url_rule('/list-index-mongo', 'list_all_index', list_all_index_api, methods=['GET'])
    app.add_url_rule('/get-context-mongo', 'get_query_results_mongo', get_query_results_mongo_api, methods=['POST'])
    return app
    
# if __name__ == "__main__":
#     app = Flask(__name__)
#     app = render_mongo_pack(app)
#     app.run(host='0.0.0.0', port=5000)