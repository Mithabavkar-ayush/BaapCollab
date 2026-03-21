import os
from sqlmodel import Session, create_engine, select, SQLModel, func
from database import User, Post, Branch, RewardLog, Comment, CommentUpvote, ProjectApplicant, engine as remote_engine
from datetime import datetime, timezone

# --- CONFIGURATION ---
# Points to local SQLite DB
LOCAL_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fallback.db")
# ---------------------

def migrate():
    # Ensure local path is absolute
    abs_local_path = os.path.abspath(LOCAL_DB_PATH)
    if not os.path.exists(abs_local_path):
        print(f"❌ Error: Local database '{abs_local_path}' not found!")
        return

    print(f"🚀 Starting Comprehensive Migration to Production...")
    print(f"📍 Local Database: {abs_local_path}")
    
    local_engine = create_engine(f"sqlite:///{abs_local_path}")
    
    # ID Mapping storage
    user_id_map = {} # local_id -> remote_id
    post_id_map = {} # local_id -> remote_id
    comment_id_map = {} # local_id -> remote_id
    branch_id_map = {} # local_id -> remote_id

    try:
        with Session(local_engine) as local_session:
            remote_session = Session(remote_engine)
            
            # 1. Sync Branches
            print("\n📦 Layer 1: Syncing Branches...")
            local_branches = local_session.exec(select(Branch)).all()
            for b in local_branches:
                existing = remote_session.exec(select(Branch).where(Branch.name == b.name)).first()
                if not existing:
                    new_branch = Branch(name=b.name)
                    remote_session.add(new_branch)
                    remote_session.commit()
                    remote_session.refresh(new_branch)
                    branch_id_map[b.id] = new_branch.id
                else:
                    branch_id_map[b.id] = existing.id
            print(f"✅ Branches mapped: {len(branch_id_map)}")

            # 2. Sync Users
            print("\n👤 Layer 2: Syncing Users...")
            local_users = local_session.exec(select(User)).all()
            for u in local_users:
                existing = remote_session.exec(select(User).where(User.email == u.email)).first()
                # Update existing user profile if it's sparse
                if existing:
                    existing.reward_points = max(existing.reward_points, u.reward_points)
                    if not existing.department: existing.department = u.department
                    if not existing.skills: existing.skills = u.skills
                    if not existing.bio: existing.bio = u.bio
                    remote_session.add(existing)
                    user_id_map[u.id] = existing.id
                else:
                    u_data = u.model_dump(exclude={"id", "branch", "posts", "reward_logs", "comment_upvotes", "applications"})
                    new_user = User(**u_data)
                    # Correct branch_id if mapped
                    if u.branch_id in branch_id_map:
                        new_user.branch_id = branch_id_map[u.branch_id]
                    remote_session.add(new_user)
                    remote_session.commit()
                    remote_session.refresh(new_user)
                    user_id_map[u.id] = new_user.id
            remote_session.commit()
            print(f"✅ Users mapped: {len(user_id_map)}")

            # 3. Sync Posts
            print("\n📝 Layer 3: Syncing Posts (Projects & Forum)...")
            local_posts = local_session.exec(select(Post)).all()
            for p in local_posts:
                remote_author_id = user_id_map.get(p.author_id)
                if not remote_author_id: continue
                
                existing = remote_session.exec(select(Post).where(
                    Post.title == p.title, 
                    Post.author_id == remote_author_id,
                    Post.type == p.type
                )).first()
                
                if not existing:
                    p_data = p.model_dump(exclude={"id", "author", "comments", "applicants"})
                    p_data["author_id"] = remote_author_id
                    new_post = Post(**p_data)
                    remote_session.add(new_post)
                    remote_session.commit()
                    remote_session.refresh(new_post)
                    post_id_map[p.id] = new_post.id
                else:
                    post_id_map[p.id] = existing.id
            print(f"✅ Posts mapped: {len(post_id_map)}")

            # 4. Sync Comments
            print("\n💬 Layer 4: Syncing Comments (Assists)...")
            local_comments = local_session.exec(select(Comment)).all()
            for c in local_comments:
                remote_post_id = post_id_map.get(c.post_id)
                remote_author_id = user_id_map.get(c.author_id)
                if not remote_post_id or not remote_author_id: continue
                
                existing = remote_session.exec(select(Comment).where(
                    Comment.content == c.content,
                    Comment.post_id == remote_post_id,
                    Comment.author_id == remote_author_id
                )).first()
                
                if not existing:
                    c_data = c.model_dump(exclude={"id", "post", "upvotes"})
                    c_data["post_id"] = remote_post_id
                    c_data["author_id"] = remote_author_id
                    new_comment = Comment(**c_data)
                    remote_session.add(new_comment)
                    remote_session.commit()
                    remote_session.refresh(new_comment)
                    comment_id_map[c.id] = new_comment.id
                else:
                    comment_id_map[c.id] = existing.id
            print(f"✅ Comments mapped: {len(comment_id_map)}")

            # 5. Sync Upvotes & Reward Logs (The Points Logic)
            print("\n💎 Layer 5: Syncing Points and Upvotes...")
            # Upvotes
            local_upvotes = local_session.exec(select(CommentUpvote)).all()
            for uv in local_upvotes:
                remote_comment_id = comment_id_map.get(uv.comment_id)
                remote_voter_id = user_id_map.get(uv.voter_id)
                if remote_comment_id and remote_voter_id:
                    existing = remote_session.exec(select(CommentUpvote).where(
                        CommentUpvote.comment_id == remote_comment_id,
                        CommentUpvote.voter_id == remote_voter_id
                    )).first()
                    if not existing:
                        remote_session.add(CommentUpvote(comment_id=remote_comment_id, voter_id=remote_voter_id))
            
            # Reward Logs
            local_rewards = local_session.exec(select(RewardLog)).all()
            for r in local_rewards:
                remote_user_id = user_id_map.get(r.user_id)
                if remote_user_id:
                    existing = remote_session.exec(select(RewardLog).where(
                        RewardLog.user_id == remote_user_id,
                        RewardLog.reason == r.reason,
                        RewardLog.points == r.points
                    )).first()
                    if not existing:
                        r_data = r.model_dump(exclude={"id", "user"})
                        r_data["user_id"] = remote_user_id
                        remote_session.add(RewardLog(**r_data))
            
            # Applicants
            local_applicants = local_session.exec(select(ProjectApplicant)).all()
            for app in local_applicants:
                remote_post_id = post_id_map.get(app.post_id)
                remote_user_id = user_id_map.get(app.user_id)
                if remote_post_id and remote_user_id:
                    existing = remote_session.exec(select(ProjectApplicant).where(
                        ProjectApplicant.post_id == remote_post_id,
                        ProjectApplicant.user_id == remote_user_id
                    )).first()
                    if not existing:
                        remote_session.add(ProjectApplicant(post_id=remote_post_id, user_id=remote_user_id))
            
            remote_session.commit()
            print("✅ Points, Upvotes, and Applications synced.")

            # 6. Final User Point Recalculation (Security check)
            print("\n⚖️ Finalizing Helper Points...")
            all_users = remote_session.exec(select(User)).all()
            for u in all_users:
                # Calculate points from logs for accuracy
                total_points = remote_session.exec(select(func.sum(RewardLog.points)).where(RewardLog.user_id == u.id)).one() or 0
                u.reward_points = total_points
                remote_session.add(u)
            remote_session.commit()
            print("🏆 Helper of the Week data synchronized!")

        print("\n✅ MISSION ACCOMPLISHED: Production Sync Complete!")
        print("Live Dashboard: https://baapcollab.vercel.app")

    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    migrate()
