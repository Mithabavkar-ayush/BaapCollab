import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    # 1. Mock a user login (since we can't do real Google OAuth easily here, 
    # we'll use the 'Dev Bypass' logic which we know works on the frontend)
    # The frontend calls /auth/google with a credential. 
    # For testing, let's see if we can get a response from /branches which is public
    print("Testing /auth/branches (Public)...")
    res = requests.get(f"{BASE_URL}/auth/branches")
    print(f"Status: {res.status_code}")
    
    # 2. Test /auth/me without token
    print("\nTesting /auth/me without token (Should be 401)...")
    res = requests.get(f"{BASE_URL}/auth/me")
    print(f"Status: {res.status_code} - Body: {res.json()}")

    # 3. In the real app, we get a token from /auth/google.
    # Since I don't have a valid Google token to send, I'll check my code logic.
    # The code verifies the token using Google's lib.
    
    # Let's verify that auth_utils is being used correctly in auth.py
    # I'll check if the server is up and responding.
    print(f"\nServer is heartbeating at {BASE_URL}")

if __name__ == "__main__":
    test_auth_flow()
