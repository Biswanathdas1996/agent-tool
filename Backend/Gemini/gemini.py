import os
import google.generativeai as genai
from secretes.secrets import GEMINI_API_KEY, GOOGLE_MODEL_NAME

model = genai.GenerativeModel(GOOGLE_MODEL_NAME)
genai.configure(api_key=GEMINI_API_KEY)

try:
    os.environ["OPENAI_API_KEY"] = GEMINI_API_KEY
except Exception as e:
    print(f"Error setting environment variable: {e}")

def call_gemini(config, prompt, max_tokens=50, temperature=0.5, top_p=1):
    try:
        response = model.generate_content(prompt)
        return response.text.replace('```','').replace('gherkin','')
    except Exception as e:
        return f"An error occurred: {e}"
