import urllib.request
import json
from decouple import config

key = config("GEMINI_API_KEY", default="")
if not key:
    print("NO KEY")
    exit(1)

# List all models
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
try:
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
        models = [m['name'] for m in data.get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
        print("Available generative models:", models)
except Exception as e:
    print("Error listing models:", e)
