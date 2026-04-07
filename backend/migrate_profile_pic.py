import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Remove channel_binding if present
if "channel_binding=require" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("channel_binding=require", "")
    if DATABASE_URL.endswith("&") or DATABASE_URL.endswith("?"):
        DATABASE_URL = DATABASE_URL[:-1]

engine = create_engine(DATABASE_URL)

migration_query = 'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;'

try:
    with engine.connect() as connection:
        connection.execute(text(migration_query))
        connection.commit()
    print("✅ Migration successful: profile_pic_url column added to 'user' table.")
except Exception as e:
    print(f"❌ Migration failed: {e}")
