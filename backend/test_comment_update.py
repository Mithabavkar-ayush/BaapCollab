import requests
import time

BASE_URL = "http://localhost:8000"

def test_comment_update():
    # 1. Login as Ayush (Topic Owner/Helper)
    print("\n--- Testing Comment Update ---")
    login_data = {"email": "ayush@example.com", "name": "Ayush Mithabavkar"}
    res = requests.post(f"{BASE_URL}/auth/google", json=login_data)
    if "token" not in res.json():
        print(f"Login failed: {res.text}")
        exit(1)
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get a post and search for Ayush's comment
    posts = requests.get(f"{BASE_URL}/posts/").json()
    post_id = posts[0]["id"]
    
    # Create a test comment if none exists
    res = requests.post(f"{BASE_URL}/posts/{post_id}/comments", 
                       json={"content": f"Test assist at {time.time()}"}, 
                       headers=headers)
    comment = res.json()
    comment_id = comment["id"]
    print(f"Created comment {comment_id}")
    
    # 3. Update the comment
    new_content = f"Updated assist at {time.time()}"
    res = requests.patch(f"{BASE_URL}/posts/{post_id}/comments/{comment_id}", 
                        json={"content": new_content}, 
                        headers=headers)
    
    if res.ok:
        updated = res.json()
        print(f"SUCCESS: Comment updated to: {updated['content']}")
        assert updated["content"] == new_content
    else:
        print(f"FAILED: Status {res.status_code}, {res.text}")
        exit(1)

if __name__ == "__main__":
    test_comment_update()
