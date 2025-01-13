import os
import openai

from Gemini.gemini import call_gemini

from config import TECHNOLOGY


# Define paths
INPUT_FOLDER = "./Code/src_code"
OUTPUT_FOLDER = "./Code/report"

# Create output folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

SAMPLE_FORMAT = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Quality Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f4f7f6;
            color: #333;
        }
        h1 {
            color: #1e8bc3;
        }
        .section-header {
            background-color: #1e8bc3;
            color: white;
            padding: 10px;
            margin-bottom: 15px;
        }
        .issue-list {
            margin-top: 20px;
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #ffffff;
        }
        .issue {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .issue:last-child {
            border-bottom: none;
        }
        .severity {
            font-weight: bold;
            color: #d9534f; /* Default red for high severity */
        }
        .recommendation {
            font-weight: bold;
        }
        .description {
            font-style: italic;
        }
        .suggestion {
            margin-top: 5px;
            padding-left: 15px;
            color: #555;
        }
    </style>
</head>
<body>
    <h1>Code Quality Report</h1>

    <p><strong>Introduction:</strong> This report provides a detailed analysis of the code, focusing on identifying quality issues, correctness, security vulnerabilities, and suggestions for improvements.</p>
    
    <p><strong>Documentation:</strong> This code is designed for XYZ purposes. Please review the issues and suggested improvements below.</p>

    <div class="section-header">Issues Found:</div>
    <div class="issue-list">
        <!-- Repeat the following block for each issue -->
        <div class="issue">
            <span class="severity">High Severity</span>
            <p class="recommendation">Recommendation 1:</p>
            <p class="description">[Detailed feedback and suggested improvements for this issue.]</p>
            <div class="suggestion">
                <strong>Suggested Improvement:</strong> [Actionable recommendation or best practice.]
            </div>
        </div>

        <div class="issue">
            <span class="severity">Medium Severity</span>
            <p class="recommendation">Recommendation 2:</p>
            <p class="description">[Detailed feedback and suggested improvements for this issue.]</p>
            <div class="suggestion">
                <strong>Suggested Improvement:</strong> [Actionable recommendation or best practice.]
            </div>
        </div>
        <!-- Add more issues here as necessary -->
    </div>
</body>
</html>
"""

def set_openai_api_key():
    openai.api_key = os.environ["OPENAI_API_KEY"]

def analyze_code(file_path):
    """
    Analyze the code using OpenAI API and return a quality report.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            code_content = file.read()
        prompt = f"""
                    Analyze the following code for quality issues, best practices, correctness, and security. Provide detailed feedback and recommendations in an ordered list, one by one. Format the output as a well-structured HTML report.

                    Code:
                    {code_content}
                    \n\n
                    Output format:\n
                    - Provide details documentations of the code.\n
                    - The report should be structured in an HTML format with a `<head>` containing metadata and a `<body>` with a title, introduction, Code documentations and the ordered list of recommendations.\n
                    - Each recommendation in the ordered list should have a brief description followed by the suggested improvement or best practice.\n
                    - Ensure the HTML is properly formatted with appropriate sections, headings, and lists.\n

                    Example HTML structure:
                    {SAMPLE_FORMAT}\n
                    """
        if(TECHNOLOGY != "GEMINI"):
            print("Using OpenAI")
            set_openai_api_key()
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a code quality analyzer."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response['choices'][0]['message']['content']
        else:
            print("Using Gemini")
            return call_gemini("You are a code quality analyzer", prompt)    
    
    except Exception as e:
        return f"Error analyzing code: {e}"

def generate_doc_for_code(file_path):
    """
    Generate documentation for the code using OpenAI API and return a quality report.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            code_content = file.read()
        prompt = f"""
                    Reverse engineer the following code and provide detailed documentations of the code. The report should be structured in an HTML format with a `<head>` containing metadata and a `<body>` with a title, introduction, Code documentations and the ordered list of recommendations.\n
                    
                    Code:
                    {code_content}
                    \n\n
                    Output format:\n
                    - Provide details documentations of the code.\n
                    - The report should be structured in an HTML format with a `<head>` containing metadata and a `<body>` with a title, introduction, Code documentations and the ordered list of recommendations.\n
                    - Each recommendation in the ordered list should have a brief description followed by the suggested improvement or best practice.\n
                    - Ensure the HTML is properly formatted with appropriate sections, headings, and lists.\n
                    """
        if(TECHNOLOGY != "GEMINI"):
            print("Using OpenAI")
            set_openai_api_key()
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a code quality analyzer."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response['choices'][0]['message']['content']
        else:
            print("Using Gemini")
            return call_gemini("You are a code quality analyzer", prompt)

    except Exception as e:
        return f"Error generating documentation: {e}"

def save_report(report, file_path):
    """
    Save the report to the specified file path.
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as report_file:
            report_file.write(report)
    except Exception as e:
        print(f"Error saving report: {e}")

def process_folder(generate_doc=False):
    """
    Recursively process each file in the folder and generate a quality report.
    """
    try:
        for root, _, files in os.walk(INPUT_FOLDER):
            for file in files:
                file_path = os.path.join(root, file)
                if file_path.endswith(('.py', '.js', '.tsx', '.java', '.cpp', '.html', '.css')):  # Add other extensions as needed
                    print(f"Analyzing: {file_path}")
                    if generate_doc:
                        report = generate_doc_for_code(file_path)
                    else:
                        report = analyze_code(file_path)
                    
                    # Save the report
                    relative_path = os.path.relpath(file_path, INPUT_FOLDER)
                    report_file_path = os.path.join(OUTPUT_FOLDER, relative_path + ".report.html")
                    save_report(report, report_file_path)
    except Exception as e:
        print(f"Error processing folder: {e}")
