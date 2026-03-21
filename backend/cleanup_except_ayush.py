from sqlmodel import Session, select, delete
from database import engine, User, Post, Comment, CommentUpvote, ProjectApplicant, RewardLog

def cleanup_except_user(keep_email: str):
    with Session(engine) as session:
        # Get the user to keep
        user_to_keep = session.exec(select(User).where(User.email == keep_email)).first()
        
        if not user_to_keep:
            print(f"User {keep_email} not found. No cleanup performed.")
            return
        
        keep_id = user_to_keep.id
        print(f"Keeping user: {keep_email} (ID: {keep_id})")

        # Delete RewardLog
        session.exec(delete(RewardLog).where(RewardLog.user_id != keep_id))
        
        # Delete CommentUpvote
        session.exec(delete(CommentUpvote).where(CommentUpvote.voter_id != keep_id))
        
        # Delete ProjectApplicant
        session.exec(delete(ProjectApplicant).where(ProjectApplicant.user_id != keep_id))
        
        # Delete Comments
        # We also need to delete comments on posts that will be deleted
        # But let's first delete comments NOT by our user
        session.exec(delete(Comment).where(Comment.author_id != keep_id))
        
        # Delete Posts not by our user
        session.exec(delete(Post).where(Post.author_id != keep_id))
        
        # Finally delete other users
        session.exec(delete(User).where(User.id != keep_id))
        
        session.commit()
        print("✅ Database cleaned successfully. Only {} and their data remain.".format(keep_email))

if __name__ == "__main__":
    cleanup_except_user("ayushmith249@gmail.com")
