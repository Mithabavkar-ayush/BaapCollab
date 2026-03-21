import sqlite3
import os

def migrate():
    db_path = "test.db"
    if not os.path.exists(db_path):
        # Check root directory if not in backend
        db_path = "../baap_collab.db" # Wait, I saw baap_collab.db in root and test.db in backend
    
    # Let's check which one is used. main.py says DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    # And it's running in backend. So it's test.db in backend.
    
    db_path = "test.db"
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'STUDENT'")
        conn.commit()
        print("✅ Column 'role' added to 'user' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("ℹ️ Column 'role' already exists.")
        else:
            print(f"❌ Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
