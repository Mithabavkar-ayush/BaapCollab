import sqlite3
from sqlalchemy.orm import Session
from database import User, Post, Comment, CommentUpvote, ProjectApplicant, engine as pg_engine
from datetime import datetime, timezone
import os

# Connect to the old SQLite database
sqlite_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "baap_collab.db")
if not os.path.exists(sqlite_db_path):
    print(f"Error: Could not find {sqlite_db_path}")
    exit(1)

print(f"Connecting to SQLite at: {sqlite_db_path}")
conn = sqlite3.connect(sqlite_db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

sqlite_users = cursor.execute("SELECT * FROM user").fetchall()
user_map = {}  # SQLite ID -> PG ID

with Session(pg_engine) as pg_session:
    # Step 1: Map & Migrate Users
    print("--- Mapping & Migrating Users ---")
    for su in sqlite_users:
        # Always query first to check for existing user
        pg_user = pg_session.query(User).filter(User.email == su["email"]).first()
        if pg_user:
            user_map[su["id"]] = pg_user.id
            print(f"  Existing: {su['email']} -> PG ID {pg_user.id}")
        else:
            try:
                new_user = User(
                    email=su["email"],
                    name=su["name"],
                    picture=su["picture"],
                    branch_id=su["branch_id"],
                    department=su["department"],
                    graduation_year=su["graduation_year"],
                    skills=su["skills"],
                    bio=su["bio"],
                    linkedin_url=su["linkedin_url"],
                    github_url=su["github_url"],
                    reward_points=su["reward_points"] or 0,
                    is_first_login=bool(su["is_first_login"]),
                    has_seen_welcome=bool(su["has_seen_welcome"]) if "has_seen_welcome" in su.keys() else False
                )
                pg_session.add(new_user)
                pg_session.commit()
                pg_session.refresh(new_user)
                
                # Backfill RewardLog if user has points
                if new_user.reward_points > 0:
                    reward_log = RewardLog(
                        user_id=new_user.id,
                        points=new_user.reward_points,
                        reason="Migrated from SQLite"
                    )
                    pg_session.add(reward_log)
                    pg_session.commit()
                
                user_map[su["id"]] = new_user.id
                print(f"  Created: {su['email']} -> PG ID {new_user.id}")
            except Exception as e:
                pg_session.rollback()
                # Try fetching after rollback (might have been created by a prior run)
                pg_user = pg_session.query(User).filter(User.email == su["email"]).first()
                if pg_user:
                    user_map[su["id"]] = pg_user.id
                    print(f"  Found after rollback: {su['email']} -> PG ID {pg_user.id}")
                else:
                    print(f"  FAILED to create user {su['email']}: {e}")

    print(f"Users done. Map: {user_map}")

    # Step 2: Migrate Posts
    print("\n--- Migrating Posts ---")
    sqlite_posts = cursor.execute("SELECT * FROM post").fetchall()
    post_map = {}

    for sp in sqlite_posts:
        author_sqlite_id = sp["author_id"]
        if author_sqlite_id not in user_map:
            print(f"  Skipping post '{sp['title']}': author not mapped.")
            continue
        pg_author_id = user_map[author_sqlite_id]

        existing = pg_session.query(Post).filter(
            Post.title == sp["title"],
            Post.author_id == pg_author_id,
            Post.type == sp["type"]
        ).first()

        if existing:
            post_map[sp["id"]] = existing.id
            print(f"  Exists: '{sp['title']}'")
            continue

        try:
            created_at = datetime.fromisoformat(sp["created_at"]) if sp["created_at"] else datetime.now(timezone.utc)
        except Exception:
            created_at = datetime.now(timezone.utc)

        new_post = Post(
            title=sp["title"],
            content=sp["content"],
            type=sp["type"],
            author_id=pg_author_id,
            created_at=created_at
        )
        pg_session.add(new_post)
        pg_session.flush()
        post_map[sp["id"]] = new_post.id
        print(f"  Migrated: '{sp['title']}' -> PG ID {new_post.id}")

    pg_session.commit()
    print(f"Posts committed. {len(post_map)} posts in PG.")

    # Step 3: Migrate Comments
    print("\n--- Migrating Comments ---")
    sqlite_comments = cursor.execute("SELECT * FROM comment").fetchall()
    comment_map = {}

    for sc in sqlite_comments:
        if sc["author_id"] not in user_map or sc["post_id"] not in post_map:
            continue
        pg_author_id = user_map[sc["author_id"]]
        pg_post_id = post_map[sc["post_id"]]

        existing = pg_session.query(Comment).filter(
            Comment.content == sc["content"],
            Comment.author_id == pg_author_id,
            Comment.post_id == pg_post_id
        ).first()

        if existing:
            comment_map[sc["id"]] = existing.id
            continue

        try:
            created_at = datetime.fromisoformat(sc["created_at"]) if sc["created_at"] else datetime.now(timezone.utc)
        except Exception:
            created_at = datetime.now(timezone.utc)

        new_comment = Comment(
            content=sc["content"],
            is_helpful=bool(sc["is_helpful"]) if "is_helpful" in sc.keys() else False,
            post_id=pg_post_id,
            author_id=pg_author_id,
            created_at=created_at
        )
        pg_session.add(new_comment)
        pg_session.flush()
        comment_map[sc["id"]] = new_comment.id

    pg_session.commit()
    print(f"Comments committed. {len(comment_map)} comments in PG.")

    print("\n=== Migration Complete! ===")

conn.close()
