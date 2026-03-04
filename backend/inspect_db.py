from sqlmodel import Session, select
from database import engine, User, Comment, CommentUpvote

def inspect():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        print("Users:")
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")
        
        comments = session.exec(select(Comment)).all()
        print("\nComments:")
        for c in comments:
            print(f"ID: {c.id}, Author ID: {c.author_id}, Content: {c.content}")
            
        upvotes = session.exec(select(CommentUpvote)).all()
        print("\nUpvotes:")
        for uv in upvotes:
            print(f"Comment ID: {uv.comment_id}, Voter ID: {uv.voter_id}")

if __name__ == "__main__":
    inspect()
