import subprocess
import json

prompt = '''
You are a laptop automation agent.
Return ONLY this JSON array with no other text:
[{"action": "open_app", "params": {"app_name": "Calculator"}}, {"action": "sleep", "params": {"seconds": 1.0}}]
'''

result = subprocess.run(
    ["gemini", "-p", prompt],
    capture_output=True, text=True, timeout=30
)

raw = result.stdout.strip()
raw = raw.replace("```json", "").replace("```", "").strip()
start = raw.find("[")
end = raw.rfind("]")
raw = raw[start:end+1]

actions = json.loads(raw)
print("Parsed actions:", actions)
print("Action count:", len(actions))
