import requests
import os
from dotenv import load_dotenv
import time

load_dotenv()

URL = "http://localhost:8000"
TOKEN = os.getenv("SECRET_TOKEN")

def test_memory():
    print("Checking if memory is being captured...")
    from core.memory import MemoryStore
    store = MemoryStore()
    results = store.search("", limit=1)
    if results:
        print(f"✅ Memory found: {results[0][1]}")
    else:
        print("❌ No memory found yet. Make sure main.py is running.")

def test_goal():
    print("Testing Autonomous Goal...")
    payload = {
        "goal": "Open the calculator, type 12345, and then minimize it."
    }
    headers = {"x-dispatch-token": TOKEN}
    
    try:
        response = requests.post(f"{URL}/goal", json=payload, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Iterations: {data['iterations']}")
            print(f"Summary: {data['summary']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_memory()
    # test_goal() # Uncomment to run full goal test (will move your mouse!)
