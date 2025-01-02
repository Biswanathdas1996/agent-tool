from flask import Flask, request, jsonify
import os
import zipfile
from flask import send_file
from .gitClone import clone_github_repo
from .codeReview import process_folder

def clear_folder(dest_folder):
    """
    Clear all files and directories in the specified folder.
    """
    if os.path.exists(dest_folder):
        for root, dirs, files in os.walk(dest_folder, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))


def submit_repo():
    data = request.get_json()
    git_repo_link = data.get('git_repo_link')
    
    if not git_repo_link:
        return jsonify({'error': 'git_repo_link is required'}), 400
    result = clone_github_repo(git_repo_link)
    # Process the git_repo_link as needed
    # For now, just return it in the response
    return jsonify({'result': result}), 200

def process_code():
    try:
        data = process_folder()
        clear_folder('./Code/src_code')
        return jsonify({'result': "Code processed successfully"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def create_zip_of_repo(repo_path, zip_path):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(repo_path):
            for file in files:
                zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), repo_path))

def download_repo():
    # Assuming the repo is cloned to a folder named 'repo'
    repo_path = './Code/report'
    zip_path = './Code/repo.zip'
    
    # Create a zip of the repo folder
    create_zip_of_repo(repo_path, zip_path)
    clear_folder('./Code/report')
    # Send the zip file as a response
    return send_file(zip_path, as_attachment=True)

def render_code_review_agent(app):
    
    app.add_url_rule('/submit-repo', 'submit_repo_api', submit_repo, methods=['POST'])
    app.add_url_rule('/process-code', 'process_folder_api', process_code, methods=['GET'])
    app.add_url_rule('/download-repo', 'download_repo_api', download_repo, methods=['GET'])
    return app