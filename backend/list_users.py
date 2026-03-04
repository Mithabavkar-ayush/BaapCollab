from sqlmodel import Session, select, create_engine
from database import User, Post, Comment, RewardLog, CommentUpvote

# Create a quiet engine
sqlite_url = "sqlite:///baap_collab.db"
quiet_engine = create_engine(sqlite_url, echo=False)

def list_all_users():
    print("--- ALL USERS ---")
    with Session(quiet_engine) as session:
        users = session.exec(select(User)).all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Name: {u.name}")
    print("-----------------")

if __name__ == "__main__":
    list_all_users()
