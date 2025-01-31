import requests
from flask import request, jsonify, send_file
from Gemini.gemini import call_gemini

def get_pr_code_changes(owner, repo, pr_number):
    
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
    response = requests.get(url)
    
    if response.status_code != 200:
        raise Exception(f"Failed to fetch PR data: {response.status_code}, {response.text}")
    
    files = response.json()
    code_changes = ""
    
    for file in files:
        filename = file["filename"]
        patch = file.get("patch", "No patch available")
        
        code_changes += f"\nFile: {filename}\n{patch}\n"
    
    return code_changes


def submit_to_compare_code():
    try:
        data = request.get_json()

        owner = data.get('owner')
        repo = data.get('repo')
        pr_number = data.get('pr_number')
        user_story = data.get('user_story')
        
        

        if not owner:
            return jsonify({'error': 'owner is required'}), 400
        if not repo:
            return jsonify({'error': 'repo is required'}), 400
        if not pr_number:
            return jsonify({'error': 'pr_number is required'}), 400
        
        # Example usage:
        owner = "Biswanathdas1996"
        repo = "agent-tool"
        pr_number = 1

        changes = get_pr_code_changes(owner, repo, pr_number)
        print(changes)

        prompt = f"""
        Compare the code changes in the PR with the user story below and provide feedback on the code changes.

        user story: {user_story}

        code changes:{changes}

        """
        llm_result = call_gemini(prompt)

        return jsonify({'result': llm_result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def render_code_compare_pack(app):
    app.add_url_rule('/compare-user-story-code', 'submit_to_compare_code_api', submit_to_compare_code, methods=['POST'])
    return app



