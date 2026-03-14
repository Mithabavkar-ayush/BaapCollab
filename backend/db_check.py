import os
from sqlmodel import Session, select, create_engine, SQLModel
from database import User, Post, RewardLog, Branch, Comment, ProjectApplicant

# Ensure we use the production database URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("Error: DATABASE_URL not found in environment!")
    exit(1)

engine = create_engine(database_url)

def check_db():
    print(f"Auditing Database: {database_url.split('@')[-1]}")
    
    try:
        with Session(engine) as session:
            # Check Tables
            from sqlalchemy import inspect, text
            inspector = inspect(engine)
            print("\nTables found:", inspector.get_table_names())
            
            # User Count
            users = session.exec(select(User)).all()
            print(f"\nUSERS ({len(users)}):")
            for u in users:
                print(f"  - {u.email} (ID: {u.id}, Points: {u.reward_points}, Branch: {u.branch_id})")
                
            # Post Count
            posts = session.exec(select(Post)).all()
            print(f"\nPOSTS ({len(posts)}):")
            for p in posts:
                print(f"  - {p.title} (ID: {p.id}, Type: {p.type}, Author: {p.author_id})")
            
            # Count by type
            forum_count = len([p for p in posts if p.type == 'FORUM'])
            lfm_count = len([p for p in posts if p.type == 'LFM'])
            print(f"  - FORUM count: {forum_count}")
            print(f"  - LFM count: {lfm_count}")

            # Reward Logs
            rewards = session.exec(select(RewardLog)).all()
            print(f"\nREWARD LOGS ({len(rewards)}):")

    except Exception as e:
        print(f"\nCRITICAL DATABASE ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_db()
