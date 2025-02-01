import os
from PIL import Image  # type: ignore
import base64
from io import BytesIO
import re
from flask import request, jsonify, stream_with_context
from secretes.secrets import GOOGLE_ING_MODEL_NAME, GEMINI_API_KEY
from Gemini.gemini import call_gemini
import google.generativeai as genai

img_model = genai.GenerativeModel(model_name=GOOGLE_ING_MODEL_NAME)
genai.configure(api_key=GEMINI_API_KEY)

def extract_image(file_path):
    try:
        print("Opening image file...")
        img = Image.open(file_path)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        print("Image file opened and saved to buffer.")
        return extract_img_content(file_path)
    except Exception as e:
        print(f"An error occurred while processing the image: {e}")
        return f"An error occurred while processing the image: {e}"

def extract_img_content(image_path):
    try:
        print("Reading image file...")
        with open(image_path, "rb") as file:
            image_data = file.read()
        encoded_image = base64.b64encode(image_data).decode("utf-8")
        mime_type = "image/png"
        prompt = """
            You are a good image reader.\n
            describe such that any html developer can develop exact same looking html code.\n
            get details color, size, position, and other details.\n
            if possible provide the css, html with exact same dimensions code as well.\n
            A single page html there the css should be in <style> tag inside the <head> tag.\n
            use sample / dummy image url, get it from the web, no image should be broken.\n
            height and width should be same as the image.\n
        """
        print("Generating content from image...")
        response = img_model.generate_content([{'mime_type': mime_type, 'data': encoded_image}, prompt])
        print("Content generated from image.")
        return response.text
    except Exception as e:
        print(f"An error occurred while extracting image content: {e}")
        return f"An error occurred while extracting image content: {e}"

def generate_html(description):
    prompt = f"""
    Generate a single page HTML code based on the following description: {description},\n
    Get dummy images link from the web and use it in the html code.\n 
    Make the code responsive for multiple devices.\n
    A single page html there the css should be in <style> tag inside the <head> tag\n 
    Expected output:\n
    ```html\n
    ......html code......\n
    ```\n
    no other text should be present in the output apart from the above.\n
    """
    print("Calling Gemini API to generate HTML code...")
    response_code_LLM = call_gemini(prompt)
    
    print("Processing the response from Gemini API...")
    response_code_LLM = re.sub(r'```html(.*?)```', r'\1', response_code_LLM, flags=re.DOTALL).strip()
    response_code_LLM = response_code_LLM.replace('<html lang="en">', "page_open_tag")
    response_code_LLM = response_code_LLM.replace('</html>', "page_close_tag")
    response_code_LLM = response_code_LLM.replace("html", "")
    response_code_LLM = response_code_LLM.replace("page_open_tag", '<html lang="en">')
    response_code_LLM = response_code_LLM.replace('page_close_tag', '</html>')

    print("HTML code generated.")
    return response_code_LLM



def generate_html_from_image():
    if 'image' not in request.files:
        print("No image file provided.")
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        print("No selected file.")
        return jsonify({"error": "No selected file"}), 400

    try:
        image_path = os.path.join("img_to_html/uploads", image_file.filename)
        os.makedirs("img_to_html/uploads", exist_ok=True)
        image_file.save(image_path)
        print(f"Image file saved to {image_path}.")
        response = extract_image(image_path)
        html_code = generate_html(response)
        html_content = re.search(r'```html(.*?)```', html_code, re.DOTALL)
        if html_content:
            html_code = html_content.group(1).strip()
        print("Returning generated HTML code.")
        return jsonify({"html_code": html_code})
    except Exception as e:
        print(f"An error occurred: {e}")
        
@stream_with_context
def generate(image_file):
    
    if image_file.filename == '':
        yield f"data: {jsonify({'error': 'No selected file'}).get_data(as_text=True)}\n\n"
        return

    try:
        yield f"Check raw image.\n\n"
        image_path = os.path.join("img_to_html/uploads", image_file.filename)
        os.makedirs("uploads", exist_ok=True)
        image_file.save(image_path)
        yield f"Image file temporarily saved to {image_path}.\n\n"
        yield f"Image Extraction started.\n\n"
        response = extract_image(image_path)
        yield f"Image content extracted successfully.\n\n"
        yield response
        yield f"Generating code with context...\n\n"
        html_code = generate_html(response)
        yield f"Filtering the code\n\n"
        html_content = re.search(r'```html(.*?)```', html_code, re.DOTALL)
        if html_content:
            html_code = html_content.group(1).strip()
        yield f"Code generated.\n\n"
        yield f"final_data: {html_code}\n\n"
    except Exception as e:
        yield f"data: An error occurred: {e}\n\n"

def stream_html_generation(app):
    if 'image' not in request.files:
        return f"data: {jsonify({'error': 'No image file provided stream'}).get_data(as_text=True)}\n\n"
        

    image_file = request.files['image']
    return app.response_class(generate(image_file), mimetype='text/event-stream')



def render_img_to_html_pack(app):
    print("Adding URL rule for /generate-img-to-html...")
    app.add_url_rule('/generate-img-to-html', 'generate_html_from_image_api', generate_html_from_image, methods=['POST'])
    app.add_url_rule('/stream-generate-img-to-html', 'stream_html_generation', lambda: stream_html_generation(app), methods=['POST'])
    print("URL rule added.")
    return app
