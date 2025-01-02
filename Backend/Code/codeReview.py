import os
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.llms import OpenAI
from secretes.secrets import OPENAI_API_KEY
import openai





# Define paths
input_folder = "./Code/src_code"
output_folder = "./Code/report"

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

sample_format = """
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


def analyze_code(file_path):
    """
    Analyze the code using OpenAI API and return a quality report.
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        code_content = file.read()

    try:
        # Set the OpenAI API key
        openai.api_key = OPENAI_API_KEY
        # Use OpenAI to analyze code
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a code quality analyzer."},
                {"role": "user", "content": f"""
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
                {sample_format}\n

                """}
            ]
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        return f"Error analyzing code: {e}"





def process_folder(folder_path=input_folder):
    """
    Recursively process each file in the folder and generate a quality report.
    """
    for root, _, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            if file_path.endswith(('.py', '.js', '.tsx', '.java', '.cpp', '.html', '.css')):  # Add other extensions as needed
                print(f"Analyzing: {file_path}")
                report = analyze_code(file_path)
                
                # Save the report
                relative_path = os.path.relpath(file_path, input_folder)
                report_file_path = os.path.join(output_folder, relative_path + ".report.html")
                os.makedirs(os.path.dirname(report_file_path), exist_ok=True)
                
                with open(report_file_path, 'w', encoding='utf-8') as report_file:
                    report_file.write(report)
    


