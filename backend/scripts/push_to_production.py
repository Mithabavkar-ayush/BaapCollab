import os
from sqlmodel import Session, create_engine, select, SQLModel
from database import User, Post, Branch, RewardLog, Comment, CommentUpvote, ProjectApplicant, engine as remote_engine

# --- CONFIGURATION ---
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fallback.db")
# The remote_engine is already configured via DATABASE_URL in your .env
# ---------------------

def migrate():
    # Ensure local path is absolute
    abs_local_path = os.path.abspath(LOCAL_DB_PATH)
    if not os.path.exists(abs_local_path):
        print(f"❌ Error: Local database '{abs_local_path}' not found!")
        return

    print(f"🚀 Starting migration to production...")
    print(f"📍 Local: {abs_local_path}")
    
    local_engine = create_engine(f"sqlite:///{abs_local_path}")
    
    try:
        with Session(local_engine) as local_session:
            # 1. Sync Branches
            branches = local_session.exec(select(Branch)).all()
            print(f"📦 Syncing {len(branches)} branches...")
            with Session(remote_engine) as remote_session:
                for b in branches:
                    existing = remote_session.exec(select(Branch).where(Branch.name == b.name)).first()
                    if not existing:
                        remote_session.add(Branch(name=b.name))
                remote_session.commit()

            # 2. Sync Users
            users = local_session.exec(select(User)).all()
            print(f"👤 Syncing {len(users)} users...")
            with Session(remote_engine) as remote_session:
                for u in users:
                    existing = remote_session.exec(select(User).where(User.email == u.email)).first()
                    if not existing:
                        u_data = u.dict(exclude={"id", "branch", "posts", "reward_logs", "comment_upvotes", "applications"})
                        remote_session.add(User(**u_data))
                remote_session.commit()

            # 3. Sync Posts
            posts = local_session.exec(select(Post)).all()
            print(f"📝 Syncing {len(posts)} posts...")
            with Session(remote_engine) as remote_session:
                for p in posts:
                    existing = remote_session.exec(select(Post).where(Post.title == p.title, Post.author_id == p.author_id)).first()
                    if not existing:
                        p_data = p.dict(exclude={"id", "author", "comments", "applicants"})
                        remote_session.add(Post(**p_data))
                remote_session.commit()

            # 4. Sync Reward Logs
            rewards = local_session.exec(select(RewardLog)).all()
            print(f"💎 Syncing {len(rewards)} reward logs...")
            with Session(remote_engine) as remote_session:
                for r in rewards:
                    # Reason + UserID as a loose uniqueness check
                    existing = remote_session.exec(select(RewardLog).where(RewardLog.reason == r.reason, RewardLog.user_id == r.user_id)).first()
                    if not existing:
                        r_data = r.dict(exclude={"id", "user"})
                        remote_session.add(RewardLog(**r_data))
                remote_session.commit()

        print("\n✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("Your data is now live on Railway PostgreSQL.")
        print("Refresh: https://baapcollab.vercel.app")

    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    migrate()
