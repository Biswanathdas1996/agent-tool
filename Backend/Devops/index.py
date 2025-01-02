
import uuid
from secretes.secrets import NETLIFY_API_KEY

import os
import hashlib
import requests
from flask import Flask, request, jsonify


# Replace these values with your own
NETLIFY_TOKEN = NETLIFY_API_KEY
SITE_NAME = f"your-site-name-{uuid.uuid4().hex[:8]}"  # Will be part of the URL, e.g., your-site-name.netlify.app



def create_site():

    url = "https://api.netlify.com/api/v1/sites"
    headers = {
        "Authorization": f"Bearer {NETLIFY_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"body": {"name": SITE_NAME}}
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    print("Site created successfully.")
    return response.json()

def compute_sha1(file_path):
    """Compute SHA-1 hash of a file."""
    with open(file_path, "rb") as f:
        file_data = f.read()
    return hashlib.sha1(file_data).hexdigest(), file_data

def deploy_file(site_id, file_path):
    """Deploy an HTML file to Netlify."""
    sha1_hash, file_data = compute_sha1(file_path)

    # Step 1: Initiate deployment
    print("Initiating deployment...")
    url = f"https://api.netlify.com/api/v1/sites/{site_id}/deploys"
    headers = {
        "Authorization": f"Bearer {NETLIFY_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"files": {"/index.html": sha1_hash}}
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    deploy_data = response.json()

 
    # Step 2: Upload missing files
    required_files = deploy_data.get("required", [])
    if not required_files:
        print("No files to upload. Deployment complete.")
        return deploy_data

    print("Uploading missing files...")
    for file_hash in required_files:
        deploy_base_url = deploy_data.get("id")
        upload_url = f"https://api.netlify.com/api/v1/deploys/{deploy_base_url}/files/{file_hash}"
        print(f"Uploading to {upload_url}...")
        upload_response = requests.put(
            upload_url,
            headers={"Authorization": f"Bearer {NETLIFY_TOKEN}","Content-Type": "application/octet-stream"},
            data=file_data,
        )
        upload_response.raise_for_status()

    print("All files uploaded successfully.")
    return deploy_data

def convert_code_to_file(code):
    html_dir = "code"
    os.makedirs(html_dir, exist_ok=True)
    html_file_path = os.path.join(html_dir, "index.html")
    with open(html_file_path, "w") as html_file:
        html_file.write(code)
    return html_file_path

def deploy():
    if 'code' not in request.form:
        return jsonify({"error": "No code provided"}), 400

    code = request.form['code']
    html_file_path = convert_code_to_file(code)

    try:
        print("Creating Netlify site...")
        site = create_site()
        site_id = site["id"]

        print("Deploying HTML file...")
        deploy = deploy_file(site_id, html_file_path)

        url = deploy.get("deploy_ssl_url") or deploy.get("url")
        return jsonify({"message": "Deployment successful!", "url": url}), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.remove(html_file_path)

def render_deploy_agent(app):
    
    app.add_url_rule('/deploy', 'deploy_code_api', deploy, methods=['POST'])
    return app
