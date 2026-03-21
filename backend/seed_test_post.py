import os
from sqlmodel import Session, select
from database import engine, User, Post
from datetime import datetime, timezone

def seed_test():
    print(f"Connecting to: {engine.url}")
    with Session(engine) as session:
        # 1. Get a user
        user = session.exec(select(User)).first()
        if not user:
            print("No users found to author the post!")
            return
        
        print(f"Found user: {user.email} (ID: {user.id})")
        
        # 2. Create a test post
        test_post = Post(
            title="System Test Project",
            content="This is a test post created via seeding script to verify database connectivity.",
            type="LFM",
            author_id=user.id
        )
        session.add(test_post)
        
        test_forum = Post(
            title="System Test Discussion",
            content="Verifying that forum posts are also persisting correctly.",
            type="FORUM",
            author_id=user.id
        )
        session.add(test_forum)
        
        try:
            session.commit()
            print("Successfully committed test posts!")
        except Exception as e:
            print(f"Error during commit: {e}")
            session.rollback()

if __name__ == "__main__":
    seed_test()
