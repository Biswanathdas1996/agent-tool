from flask import request, jsonify
import os
import openai  # type: ignore
from PIL import Image  # type: ignore
import base64
from io import BytesIO

import google.generativeai as genai
from Gemini.gemini import call_gemini
from secretes.secrets import GOOGLE_ING_MODEL_NAME, GEMINI_API_KEY
from config import TECHNOLOGY

img_model = genai.GenerativeModel(model_name=GOOGLE_ING_MODEL_NAME)
genai.configure(api_key=GEMINI_API_KEY)

def call_gpt(config, prompt, max_tokens=50):
    """Call the GPT model with the given configuration and prompt."""
    try:
        openai.api_key = os.environ["OPENAI_API_KEY"]
    except KeyError:
        return "API key not found in environment variables."

    try:
        response = openai.ChatCompletion.create(
            model=os.environ.get("X-Ai-Model", "gpt-4"),
            messages=[
                {"role": "system", "content": config},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.5,
        )
        result = response.choices[0].message['content'].strip()
        print("GPT Response:", response)
        return result
    except Exception as e:
        return f"An error occurred: {e}"


def extract_image_GPT(file_path):
    """Extract image details and convert to base64."""
    try:
        img = Image.open(file_path)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{img_base64}"
                }
            }
        ]
        return call_gpt("You are a good image reader", content, max_tokens=2048)
        
    except Exception as e:
        return f"An error occurred while processing the image: {e}"
    

def extract_image_GEMINI(file_path):
    """Extract image details and convert to base64."""
    try:
        img = Image.open(file_path)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        encoded_image = img_base64
        mime_type = "image/png"
        prompt = """ 
            You are a good image reader.\n
            describe the image in details.\n
            get details color, size, position, and other details.\n
        """
        print("Generating content from image...")
        response = img_model.generate_content([{'mime_type': mime_type, 'data': encoded_image}, prompt])
        print("Content generated from image.")
        return response.text
    except Exception as e:
        print(f"An error occurred while extracting image content: {e}")
        return f"An error occurred while extracting image content: {e}"

def direct_gpt_call():
    """Handle direct GPT call from the API."""
    try:
        data = request.json
        user_question = data.get('question')
        token_limit = data.get('token_limit', 1000)
        if not user_question:
            return jsonify({"error": "No question provided"}), 400
        try:
            if(TECHNOLOGY == "GEMINI"):
                print("Using Gemini")
                result_json = call_gemini(user_question)
            else:
                print("Using OpenAI")
                result_json = call_gpt("You are a polite, helping intelligent agent", user_question, token_limit)    
            return result_json
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to process request: {e}"}), 500

def extract_img_api():
    """Handle image extraction API call."""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        file = request.files['file']
        file_path = os.path.join(os.environ["IMG_UPLOAD_FOLDER"], file.filename)
        file.save(file_path)
        try:
            if(TECHNOLOGY == "GEMINI"):
                img_details = extract_image_GEMINI(file_path)
            else:     
                img_details = extract_image_GPT(file_path)
            return jsonify({"details": img_details}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to process request: {e}"}), 500

def render_gpt_pack(app):
    """Register API routes with the Flask app."""
    try:
        app.add_url_rule('/call-gpt', 'call_gpt_api', direct_gpt_call, methods=['POST'])
        app.add_url_rule('/extract-img', 'extract_image_api', extract_img_api, methods=['POST'])
        return app
    except Exception as e:
        print(f"An error occurred while registering routes: {e}")
        return app
