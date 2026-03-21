from sqlmodel import Session, select, delete
from database import engine, User, Post, Comment, CommentUpvote, Branch, ProjectApplicant, RewardLog
import os

def nuclear_purge():
    admin_email = "ayushmith249@gmail.com"
    print(f"🚀 [TOTAL RESET] Starting Nuclear Purge (Preserving {admin_email})...")
    
    with Session(engine) as session:
        # 1. Purge all activity and relational data
        print("Purging Activity (Doubts, Projects, Comments, etc.)...")
        session.exec(delete(CommentUpvote))
        session.exec(delete(Comment))
        session.exec(delete(ProjectApplicant))
        session.exec(delete(RewardLog))
        session.exec(delete(Post)) # Covers both FORUM (doubts) and LFM (projects)
        
        # 2. Purge Users EXCEPT Admin
        admin_user = session.exec(select(User).where(User.email == admin_email)).first()
        
        if admin_user:
            print(f"Found admin: {admin_user.email}. Preserving and resetting to high-privilege status...")
            # Reset admin for a fresh start
            admin_user.is_approved = True
            admin_user.is_first_login = False
            admin_user.has_seen_welcome = False
            admin_user.reward_points = 5000 # Admin starting bonus
            
            # Delete other users
            statement = delete(User).where(User.email != admin_email)
            session.exec(statement)
            session.add(admin_user)
        else:
            print("WARNING: Admin not found! Creating default admin is NOT supported here. Purging all.")
            session.exec(delete(User))
            
        session.commit()
    print("✅ System Purge Complete. The 'Gatekeeper' is now watching.")

if __name__ == "__main__":
    nuclear_purge()
