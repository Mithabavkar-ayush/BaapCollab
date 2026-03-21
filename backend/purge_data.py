from sqlmodel import Session, select, delete
from database import engine, User, Post, Comment, CommentUpvote, ProjectApplicant, RewardLog

def purge_data():
    with Session(engine) as session:
        print("Starting database purge...")
        
        # Keep ayushmith249@gmail.com
        admin_email = "ayushmith249@gmail.com"
        
        # Delete all reward logs
        session.exec(delete(RewardLog))
        # Delete all project applications
        session.exec(delete(ProjectApplicant))
        # Delete all comment upvotes
        session.exec(delete(CommentUpvote))
        # Delete all comments
        session.exec(delete(Comment))
        # Delete all posts
        session.exec(delete(Post))
        
        # Delete all users EXCEPT the admin
        statement = delete(User).where(User.email != admin_email)
        session.exec(statement)
        
        # Reset admin user if exists
        admin = session.exec(select(User).where(User.email == admin_email)).first()
        if admin:
            print(f"Resetting admin data for {admin_email}")
            admin.branch_id = None
            admin.department = None
            admin.graduation_year = None
            admin.skills = None
            admin.bio = None
            admin.reward_points = 0
            admin.is_approved = True  # Admin should be approved
            admin.is_first_login = True
            admin.has_seen_welcome = False
            session.add(admin)
        else:
            print(f"Admin user {admin_email} not found. You may need to login first.")
            
        session.commit()
        print("Database purge completed successfully.")

if __name__ == "__main__":
    purge_data()
