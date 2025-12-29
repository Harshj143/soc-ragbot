import os
import sys
# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agent import IncidentAgent
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

def test_agent():
    print("Initializing Agent...")
    agent = IncidentAgent()
    print("Running Query...")
    try:
        result = agent.run("Verify ransomware response")
        print("\n--- REPORT ---")
        print(result["report"])
        print("\n--- CLASSIFICATION ---")
        print(result["classification"])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_agent()
