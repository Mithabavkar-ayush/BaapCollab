import os
from sqlmodel import Session, select, create_engine
from database import User, Post, RewardLog

# HARDCODED PUBLIC URL FOR DIRECT AUDIT
db_url = "postgresql://postgres:pMhWnUfXQidkSjIisZstREuYpYbeKSTz@junction.proxy.rlwy.net:19532/railway?sslmode=require"
engine = create_engine(db_url)

def verify():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        posts = session.exec(select(Post)).all()
        rewards = session.exec(select(RewardLog)).all()
        
        print(f"--- DATABASE AUDIT ---")
        print(f"Users: {len(users)}")
        print(f"Posts: {len(posts)}")
        print(f"Rewards: {len(rewards)}")
        
        print("\n--- POST DETAILS ---")
        for p in posts:
            print(f"ID: {p.id} | Title: {p.title} | Type: {p.type} | AuthorID: {p.author_id}")
            
        print("\n--- USER POINTS ---")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Points: {u.reward_points}")

if __name__ == "__main__":
    verify()
