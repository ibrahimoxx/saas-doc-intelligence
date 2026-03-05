import urllib.request
import json
from decouple import config

key = config("GEMINI_API_KEY", default="")
if not key:
    print("NO KEY")
    exit(1)

# List models
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
try:
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read())
        models = [m['name'] for m in data.get('models', []) if 'embed' in m['name'].lower()]
        print("Available embedding models:", models)
except Exception as e:
    print("Error listing models:", e)
    
# Try text-embedding-004
url2 = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={key}"
payload = json.dumps({
    "model": "models/text-embedding-004",
    "content": {"parts": [{"text": "Hello"}]}
}).encode("utf-8")

req = urllib.request.Request(url2, data=payload, headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req) as r:
        print("text-embedding-004 works!")
except Exception as e:
    print("text-embedding-004 failed:", e)
