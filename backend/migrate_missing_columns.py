from database import engine
from sqlalchemy import text
import traceback

def migrate():
    print("Connecting to database...")
    try:
        with engine.connect() as conn:
            print("Checking current columns...")
            # We can just try to add it, if it's there it'll fail which is fine
            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN has_seen_welcome BOOLEAN DEFAULT 0"))
                conn.commit()
                print("Column 'has_seen_welcome' added successfully.")
            except Exception as e:
                print(f"Column might already exist or error adding: {e}")
            
            # Also ensure is_first_login is there just in case
            try:
                conn.execute(text("ALTER TABLE user ADD COLUMN is_first_login BOOLEAN DEFAULT 1"))
                conn.commit()
                print("Column 'is_first_login' added successfully.")
            except Exception as e:
                print(f"Column might already exist or error adding: {e}")
                
    except Exception as e:
        print(f"Migration failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    migrate()
