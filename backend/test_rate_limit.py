import requests
import time

BASE_URL = "http://localhost:8000"

def get_token():
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            data={"username": "admin", "password": "admin123"}
        )
        return response.json().get("access_token")
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def test_rate_limit():
    token = get_token()
    if not token:
        print("Could not get token, skipping test.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    query = {"query": "Test query"}

    print("Sending 6 rapid requests...")
    for i in range(1, 7):
        response = requests.post(f"{BASE_URL}/query", json=query, headers=headers)
        print(f"Request {i}: Status {response.status_code}")
        if response.status_code == 429:
            print("SUCCESS: Rate limit triggered on request 6!")
            return
    
    print("FAILURE: Rate limit was not triggered.")

if __name__ == "__main__":
    test_rate_limit()
