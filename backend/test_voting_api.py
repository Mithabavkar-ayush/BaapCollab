from sqlmodel import Session, select
from database import engine, User, Comment, CommentUpvote
from main import app
from fastapi.testclient import TestClient
from auth_utils import create_access_token
from datetime import timedelta

client = TestClient(app)

def test_voting():
    with Session(engine) as session:
        # Get Ayush (ID 1)
        ayush = session.get(User, 1)
        if not ayush:
            print("Ayush not found in DB.")
            return
        
        token = create_access_token({"sub": ayush.email}, expires_delta=timedelta(minutes=10))
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Upvote own comment (ID 5: "ohh how")
        print("\nTest 1: Upvoting own comment (ID 5)")
        res = client.post("/posts/1/comments/5/upvote", headers=headers)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.json()}")
        
        if res.status_code == 400:
            print("SUCCESS: Backend correctly rejected self-upvote.")
        else:
            print("FAILURE: Backend allowed self-upvote!")

        # Test 2: Upvote helper comment (ID 1: "hi i can help you")
        print("\nTest 2: Upvoting helper comment (ID 1)")
        res = client.post("/posts/1/comments/1/upvote", headers=headers)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.json()}")
        
        if res.status_code == 200:
            print("SUCCESS: Backend correctly allowed helper upvote.")
        else:
            print("FAILURE: Backend blocked helper upvote.")

        # Test 3: Post owner upvoting a comment on their own post
        # Ayush (ID 1) is author of Post (ID 1). Try to upvote Comment (ID 1) on Post (ID 1).
        print("\nTest 3: Post owner upvoting a comment on their own post")
        res = client.post("/posts/1/comments/1/upvote", headers=headers)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.json()}")

        if res.status_code == 400 and "Post owner cannot upvote" in res.json().get("detail", ""):
            print("SUCCESS: Backend correctly rejected post owner upvote.")
        else:
            print("FAILURE: Backend allowed post owner upvote!")

if __name__ == "__main__":
    test_voting()
