from main.nlq import nlq
from flask import Flask, request, jsonify, send_file
from gpt.analiticts import getAnalitics, call_gpt
from flask_cors import CORS
from vector_db.vector_db import delete_collection, upload_files, list_collections, search_data
from vector_db.fine_chunking import fine_chunking
import os
from helper.gpt import extract_image
from sql.db import generate_erd_from, execute_sql_query
from mongodb.rag import render_mongo_pack
from mongodb.data_handling import render_mongo_data_pack
from AI_agents.app import render_ai_agent
from Devops.index import render_deploy_agent
from Code.index import render_code_review_agent

if __name__ == "__main__":
    
    app = Flask(__name__)
    # ----------------------------mongo DB--------------------------------------------
    app = render_mongo_pack(app)
    app = render_mongo_data_pack(app)
 
    # --------------------------------------------------------------------------------

    app = render_ai_agent(app)
    app = render_deploy_agent(app)
    app = render_code_review_agent(app)

    CORS(app)
 
    

    app.config['UPLOAD_FOLDER'] = 'vector_db/uploads'
    app.config['IMG_UPLOAD_FOLDER'] = 'asset/uploads'
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['IMG_UPLOAD_FOLDER'], exist_ok=True)
    @app.before_request
    def before_request():
        custom_header = request.headers.get('X-Ai-Model')
        if custom_header:
          
            os.environ["X-Ai-Model"] = custom_header
            print(f"X-Ai-Model: {custom_header}")


# ------------------------------------user story api --------------------------------------------

@app.route('/call-gpt', methods=['POST'])
def direct_gpt_call():
        data = request.json
        user_question = data.get('question')
        token_limit = data.get('token_limit')
        if not user_question:
            return jsonify({"error": "No question provided"}), 400
        try:
            if not token_limit:
                token_limit = 1000
            result_json = call_gpt("You are a polite, helping inteligent agent", user_question, token_limit)
            return result_json
        except Exception as e:
            return jsonify({"error": str(e)}), 500


# ------------------------------------file upload --------------------------------------------

# File upload endpoint
@app.route('/upload-collection-doc', methods=['POST'])
def upload_files_data():
    print('upload-collection-doc============>')
    if 'files' not in request.files:
        return "No files provided", 400
    collection_name = request.form.get('collection_name')
    files = request.files.getlist('files')
    try:
        result = upload_files(collection_name, files, app.config['UPLOAD_FOLDER'])
        print("result====>",result)
        return jsonify({"message": result}), 200 
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Search endpoint
@app.route('/search', methods=['POST'])
def search_file_data():
    data = request.get_json()
    query = data.get('query')
    no_of_results = data.get('no_of_results')
    collection_name = data.get('collection_name')
    if_fine_chunking = data.get('fine_chunking')
    if_gpt_summarize = data.get('if_gpt_summarize')
    if not query:
        return jsonify({"error": "No query provided"}), 400       
    if not collection_name:
        return jsonify({"error": "No collection_name provided"}), 400       
    results = search_data(query, collection_name,no_of_results)

    response_result = {"results": results}
  
    ### file chunking ######
    if if_fine_chunking:
        fine_results = fine_chunking(results['documents'],query, 100)
        response_result["fine_results"] = fine_results
       
    if if_gpt_summarize:
        gpt_results = call_gpt("You are an expert summrizer", f"find and list all the key points: \n{results['documents']}", 1000)
        response_result["gpt_results"] = gpt_results
        
    return jsonify(response_result), 200


# Search endpoint
@app.route('/collection', methods=['GET'])
def get_all_collection():
    dlist_collections = list_collections()
    return jsonify({"collections": dlist_collections}), 200


# Search endpoint
@app.route('/collection', methods=['DELETE'])
def delete_collection():
    data = request.get_json()
    collection_name = data.get('collection_name')
    result = delete_collection(collection_name)
    return jsonify({"collections": result}), 200



@app.route('/extract-img', methods=['POST'])
def extract_img_api():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    file_path = os.path.join(app.config['IMG_UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    try:
        img_details = extract_image(file_path)
        return jsonify({"details": img_details}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500





if __name__ == "__main__":
        app.run()