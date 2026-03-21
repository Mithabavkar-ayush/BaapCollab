import sqlite3
import os

db_path = "fallback.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in local SQLite:")
    for table in tables:
        print(f" - {table[0]}")
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"   (Count: {count})")
    conn.close()
else:
    print("fallback.db not found")
