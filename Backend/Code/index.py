from flask import request, jsonify, send_file
import os
import zipfile
from .gitClone import clone_github_repo
from .codeReview import process_folder

report_path = './Code/report'
src_code_path = './Code/src_code'
zip_path = './Code/repo.zip'

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
    try:
        data = request.get_json()
        git_repo_link = data.get('git_repo_link')
        
        clear_folder(src_code_path)
        clear_folder(report_path)

        if not git_repo_link:
            return jsonify({'error': 'git_repo_link is required'}), 400
        
        result = clone_github_repo(git_repo_link)
        return jsonify({'result': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_code():
    try:
        data = process_folder()
        clear_folder(src_code_path)
        
        html_files = [f for f in os.listdir(report_path) if f.endswith('.html')]
        
        if not html_files:
            return jsonify({'error': 'No HTML files found in the reports folder'}), 404
        
        html_file_path = os.path.join(report_path, html_files[0])
        return send_file(html_file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_doc_for_code_fn():
    try:
        data = process_folder(generate_doc=True)
        clear_folder(src_code_path)
        
        html_files = [f for f in os.listdir(report_path) if f.endswith('.html')]
        
        if not html_files:
            return jsonify({'error': 'No HTML files found in the reports folder'}), 404
        
        html_file_path = os.path.join(report_path, html_files[0])
        return send_file(html_file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_zip_of_repo(repo_path, zip_path):
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(repo_path):
                for file in files:
                    zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), repo_path))
    except Exception as e:
        raise Exception(f"Error creating zip file: {str(e)}")

def download_repo():
    try:
        create_zip_of_repo(report_path, zip_path)
        clear_folder(report_path)
        return send_file(zip_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def render_code_review_agent(app):
    app.add_url_rule('/submit-repo', 'submit_repo_api', submit_repo, methods=['POST'])
    app.add_url_rule('/process-code', 'process_folder_api', process_code, methods=['GET'])
    app.add_url_rule('/generate-doc', 'generate_doc_for_code_api', generate_doc_for_code_fn, methods=['GET'])
    app.add_url_rule('/download-repo', 'download_repo_api', download_repo, methods=['GET'])
    return app
