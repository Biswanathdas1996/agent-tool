import os
from langchain.agents import initialize_agent, Tool, AgentType
from langchain.llms import OpenAI
from secretes.secrets import OPENAI_API_KEY


try:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
except Exception as e:
    print(f"Error setting environment variable: {e}")

# Path to the folder containing code files
SOURCE_FOLDER = "src"
REPORTS_FOLDER = "report"



# Ensure the reports folder exists
os.makedirs(REPORTS_FOLDER, exist_ok=True)

# Initialize LangChain LLM
llm = OpenAI(temperature=0.8)

def analyze_code(file_path, custom_prompt):
    """Analyzes the code in the given file using a custom prompt and returns a quality report."""
    try:
        # Read the code from the file
        with open(file_path, 'r') as file:
            code = file.read()

        # Define the analysis tool
        tools = [
            Tool(
                name="Code Analyzer",
                func=lambda text: f"Custom prompt: {custom_prompt}\n\nCode: {text[:100]}...",  # Example stub function
                description="Analyzes code quality and provides feedback using a custom prompt."
            )
        ]

        # Initialize the agent
        agent = initialize_agent( tools=tools,
        llm=llm,
        agent=AgentType.OPENAI_FUNCTIONS ,
        
        verbose=True,)

        # Run the analysis
        report = agent.run(f"{custom_prompt}\n\n{code}")
        return report

    except Exception as e:
        return f"Error analyzing file {file_path}: {str(e)}"

def save_html_report(file_name, code, report):
    """Saves an HTML report for the given code and analysis."""
    try:
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Quality Report - {file_name}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                pre {{ background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; }}
                h1, h2 {{ color: #333; }}
            </style>
        </head>
        <body>
            <h1>Code Quality Report</h1>
            <h2>File: {file_name}</h2>
          
            
            <h3>Analysis:</h3>
            <pre>{report}</pre>
        </body>
        </html>
        """

        report_file_path = os.path.join(REPORTS_FOLDER, f"{file_name}.html")
        with open(report_file_path, 'w') as html_file:
            html_file.write(html_content)

        print(f"HTML report saved: {report_file_path}")

    except Exception as e:
        print(f"Error saving HTML report for {file_name}: {str(e)}")

# Walk through the source folder
custom_prompt = """
Validate the following code for best practices, correctness, and security,
Provide a detailed code quality analysis and improvement suggestions for the following code,

Provide detailed feedback and recommendations in a ordered list one by one.
"""
for root, _, files in os.walk(SOURCE_FOLDER):
    for file_name in files:
        if file_name.endswith(('.py', '.js', '.java', '.cpp', '.ts', '.tsx')):  # Filter for code files
            file_path = os.path.join(root, file_name)

            print(f"Analyzing file: {file_path}")
            report = analyze_code(file_path, custom_prompt)

            # Read the code to include in the HTML report
            with open(file_path, 'r') as file:
                code = file.read()

            # Save the HTML report
            save_html_report(file_name, code, report)

print("Code analysis completed. Reports are saved in the reports folder.")
