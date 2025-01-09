from flask import Flask, request
from flask_cors import CORS
import os
from mongodb.rag import render_mongo_pack
from mongodb.data_handling import render_mongo_data_pack
from AI_agents.app import render_ai_agent
from Devops.index import render_deploy_agent
from Code.index import render_code_review_agent
from gpt.index import render_gpt_pack
from secretes.secrets import OPENAI_API_KEY

if __name__ == "__main__":
    
    app = Flask(__name__)
    # ----------------------------mongo DB--------------------------------------------
    app = render_mongo_pack(app)
    app = render_mongo_data_pack(app)
    # --------------------------------------------------------------------------------
    app = render_ai_agent(app)
    app = render_deploy_agent(app)
    app = render_code_review_agent(app)
    app = render_gpt_pack(app)

    CORS(app)

    os.environ["IMG_UPLOAD_FOLDER"] = 'gpt/uploads'
    os.makedirs(os.environ["IMG_UPLOAD_FOLDER"], exist_ok=True)
    try:
        os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
    except Exception as e:
        print(f"Error setting environment variable: {e}")

    @app.before_request
    def before_request():
        custom_header = request.headers.get('X-Ai-Model')
        if custom_header:
            os.environ["X-Ai-Model"] = custom_header
            print(f"X-Ai-Model: {custom_header}")

if __name__ == "__main__":
        app.run()