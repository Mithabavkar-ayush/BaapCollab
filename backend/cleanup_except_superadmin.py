from sqlmodel import Session, select, delete
from database import engine, User, Post, Comment, CommentUpvote, ProjectApplicant, RewardLog

def cleanup_except_superadmin():
    with Session(engine) as session:
        # Get all superadmin users
        superadmin_users = session.exec(select(User).where(User.role == "SUPERADMIN")).all()
        
        if not superadmin_users:
            print("No SUPERADMIN found. No cleanup performed for safety.")
            return
        
        superadmin_ids = [u.id for u in superadmin_users]
        superadmin_emails = [u.email for u in superadmin_users]
        print(f"Keeping SUPERADMIN users: {', '.join(superadmin_emails)} (IDs: {', '.join(map(str, superadmin_ids))})")

        # Delete RewardLog for non-superadmins
        session.exec(delete(RewardLog).where(RewardLog.user_id.notin_(superadmin_ids)))
        
        # Delete CommentUpvote for non-superadmins
        session.exec(delete(CommentUpvote).where(CommentUpvote.voter_id.notin_(superadmin_ids)))
        
        # Delete ProjectApplicant for non-superadmins
        session.exec(delete(ProjectApplicant).where(ProjectApplicant.user_id.notin_(superadmin_ids)))
        
        # Delete Comments NOT by a superadmin
        session.exec(delete(Comment).where(Comment.author_id.notin_(superadmin_ids)))
        
        # Delete Posts NOT by a superadmin
        session.exec(delete(Post).where(Post.author_id.notin_(superadmin_ids)))
        
        # Finally delete users who are NOT superadmins
        session.exec(delete(User).where(User.id.notin_(superadmin_ids)))
        
        session.commit()
        print("✅ Database cleaned successfully. Only SUPERADMIN accounts and their data remain.")

if __name__ == "__main__":
    cleanup_except_superadmin()
