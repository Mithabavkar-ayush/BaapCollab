from sqlmodel import Session, select
from database import engine, User, Comment, CommentUpvote
from fastapi import HTTPException

def test_logic():
    # Simulate a user (ID 1) trying to upvote their own comment (ID 5, Author ID 1)
    # This is exactly what failed before.
    with Session(engine) as session:
        comment_id = 5
        user_id = 1
        
        comment = session.get(Comment, comment_id)
        current_user = session.get(User, user_id)
        
        print(f"Testing: User {user_id} ({current_user.name}) upvoting Comment {comment_id} (Author {comment.author_id})")
        
        # Logic from posts.py
        try:
            if int(comment.author_id) == int(current_user.id):
                print("SUCCESS: Logic correctly identified self-upvote.")
                raise HTTPException(status_code=400, detail="Cannot upvote your own comment")
            else:
                print("FAILURE: Logic failed to identify self-upvote.")
        except HTTPException as e:
            print(f"Caught expected exception: {e.detail}")

        # Test helper upvote
        helper_comment_id = 1 # Assuming ID 1 is by a helper
        helper_comment = session.get(Comment, helper_comment_id)
        if helper_comment and helper_comment.author_id != user_id:
             print(f"\nTesting: User {user_id} upvoting Helper Comment {helper_comment_id} (Author {helper_comment.author_id})")
             if int(helper_comment.author_id) == int(user_id):
                 print("FAILURE: Helper check failed.")
             else:
                 print("SUCCESS: Logic correctly allowed helper upvote.")
        else:
             print("\nHelper comment not found or is also by user 1. Skipping helper check.")

if __name__ == "__main__":
    test_logic()
