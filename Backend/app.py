from flask import Flask, request
from flask_cors import CORS
import os
from Mongodb.rag import render_mongo_pack
from Mongodb.data_handling import render_mongo_data_pack
from AI_agents.app import render_ai_agent
from Devops.index import render_deploy_agent
from Code.index import render_code_review_agent
from Gpt.index import render_gpt_pack
from Azure_Cosmos.index import render_cosmos_pack
from secretes.secrets import OPENAI_API_KEY

def create_app():
    """
     Modules and Packages:
    - render_mongo_pack: Integrates MongoDB related functionalities.
    - render_mongo_data_pack: Integrates MongoDB data handling functionalities.
    - render_ai_agent: Integrates AI agent functionalities.
    - render_deploy_agent: Integrates deployment agent functionalities.
    - render_code_review_agent: Integrates code review agent functionalities.
    - render_gpt_pack: Integrates GPT related functionalities.
    Environment Variables:
    - IMG_UPLOAD_FOLDER: Directory for image uploads.
    - OPENAI_API_KEY: API key for OpenAI services.
    - X-Ai-Model: Custom header for AI model selection.
    """
    app = Flask(__name__)
    
    # app = render_mongo_pack(app)
    app = render_cosmos_pack(app)
    app = render_mongo_data_pack(app)
    app = render_ai_agent(app)
    app = render_deploy_agent(app)
    app = render_code_review_agent(app)
    app = render_gpt_pack(app)

    CORS(app)

    os.environ["IMG_UPLOAD_FOLDER"] = 'Gpt/uploads'
    os.makedirs(os.environ["IMG_UPLOAD_FOLDER"], exist_ok=True)
    
    try:
        os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
    except Exception as e:
        app.logger.error(f"Error setting environment variable: {e}")

    @app.before_request
    def before_request():
        custom_header = request.headers.get('X-Ai-Model')
        if custom_header:
            os.environ["X-Ai-Model"] = custom_header
            app.logger.info(f"X-Ai-Model header received")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run()