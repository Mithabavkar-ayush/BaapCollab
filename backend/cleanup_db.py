from sqlmodel import Session, select
from database import engine, Comment, CommentUpvote, User

def cleanup():
    with Session(engine) as session:
        upvotes = session.exec(select(CommentUpvote)).all()
        removed = 0
        for uv in upvotes:
            comment = session.get(Comment, uv.comment_id)
            if comment and int(comment.author_id) == int(uv.voter_id):
                print(f"Removing self-upvote: User {uv.voter_id} upvoted Comment {uv.comment_id}")
                session.delete(uv)
                removed += 1
                
                # Deduct points from user
                author = session.get(User, comment.author_id)
                if author and author.reward_points >= 5:
                    author.reward_points -= 5
                    session.add(author)
        
        session.commit()
        print(f"Cleanup complete. Removed {removed} self-upvotes.")

if __name__ == "__main__":
    cleanup()
