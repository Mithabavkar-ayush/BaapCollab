import sqlite3
import os

db_path = 'backend/test.db'
admin_email = 'ayushmith249@gmail.com'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    # Delete all users EXCEPT the admin
    cursor = conn.execute("DELETE FROM user WHERE email != ?", (admin_email,))
    print(f"Deleted {cursor.rowcount} non-admin users.")
    
    # Verify count
    count = conn.execute("SELECT count(*) FROM user").fetchone()[0]
    print(f"Final user count: {count}")
    
    conn.commit()
    conn.close()
else:
    print(f"DB not found at {db_path}")
