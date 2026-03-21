import sqlite3
import os

db_path = 'backend/test.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Tables to clear
    tables = [
        "rewardlog",
        "projectapplicant",
        "commentupvote",
        "comment",
        "post",
        "user"
    ]
    
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"Cleared table: {table}")
        except Exception as e:
            print(f"Error clearing {table}: {e}")
            
    conn.commit()
    
    # Verify count
    count = conn.execute("SELECT count(*) FROM user").fetchone()[0]
    print(f"Final user count: {count}")
    
    conn.close()
    print("Nuclear purge completed successfully.")
else:
    print(f"DB not found at {db_path}")
