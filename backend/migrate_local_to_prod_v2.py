import sqlite3
import os
from sqlmodel import Session, select, create_engine
from database import User, Post, engine as prod_engine
from dotenv import load_dotenv

# Load prod env
load_dotenv()

def migrate():
    # Local SQLite
    local_db = "baap_collab.db"
    if not os.path.exists(local_db):
        print(f"Error: {local_db} not found!")
        return

    print(f"Connecting to local DB: {local_db}")
    conn = sqlite3.connect(local_db)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get User columns
    cursor.execute("PRAGMA table_info(user)")
    user_cols = [row['name'] for row in cursor.fetchall()]
    print(f"User columns: {user_cols}")

    # Get Post columns
    cursor.execute("PRAGMA table_info(post)")
    post_cols = [row['name'] for row in cursor.fetchall()]
    print(f"Post columns: {post_cols}")

    # Map for local_id -> prod_id
    user_id_map = {}

    with Session(prod_engine) as session:
        # 1. Migrate Users
        print("\n--- Migrating Users ---")
        cursor.execute("SELECT * FROM user")
        local_users = cursor.fetchall()
        
        for u in local_users:
            email = u['email']
            print(f"Syncing user: {email}")
            
            # Use model_dump style or manual attribute setting
            db_user = session.exec(select(User).where(User.email == email)).first()
            if not db_user:
                print(f"  Creating new user: {email}")
                db_user = User(email=email)
            
            # Update fields from local if they exist
            if 'name' in user_cols: db_user.name = u['name']
            if 'picture' in user_cols: db_user.picture = u['picture']
            if 'branch_id' in user_cols: db_user.branch_id = u['branch_id']
            if 'department' in user_cols: db_user.department = u['department']
            if 'graduation_year' in user_cols: db_user.graduation_year = u['graduation_year']
            if 'skills' in user_cols: db_user.skills = u['skills']
            if 'bio' in user_cols: db_user.bio = u['bio']
            if 'reward_points' in user_cols: db_user.reward_points = u['reward_points'] or 0
            
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            user_id_map[u['id']] = db_user.id

        # 2. Migrate Posts
        print("\n--- Migrating Posts ---")
        cursor.execute("SELECT * FROM post")
        local_posts = cursor.fetchall()
        
        for p in local_posts:
            title = p['title']
            local_author_id = p['author_id']
            prod_author_id = user_id_map.get(local_author_id)
            
            if not prod_author_id:
                print(f"  Skipping post '{title}': Author ID {local_author_id} not found in map.")
                continue

            # Check if post exists by title and author
            existing_post = session.exec(select(Post).where(
                Post.title == title,
                Post.author_id == prod_author_id
            )).first()
            
            if existing_post:
                print(f"  Post already exists: {title}")
                continue

            print(f"  Migrating post: {title}")
            db_post = Post(
                title=p['title'],
                content=p['content'],
                type=p['type'],
                author_id=prod_author_id,
            )
            # created_at handling if exists in local
            if 'created_at' in post_cols and p['created_at']:
                # Note: Simple string assign might fail depending on DB/Type, 
                # but SQLModel/PSQL usually handles ISO strings.
                from datetime import datetime
                try:
                    # SQLite often stores as string
                    dt = datetime.fromisoformat(p['created_at'].split('.')[0].replace('Z',''))
                    db_post.created_at = dt
                except:
                    pass

            session.add(db_post)
        
        session.commit()
        print("\nMigration Completed Successfully.")

    conn.close()

if __name__ == "__main__":
    migrate()
