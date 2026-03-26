import os
from sqlalchemy import text
from sqlmodel import Session
from database import engine

def truncate_users():
    print("Connecting to database...")
    with Session(engine) as session:
        print("Executing TRUNCATE TABLE \"user\" CASCADE...")
        session.exec(text('TRUNCATE TABLE "user" CASCADE;'))
        session.commit()
        print("Truncate successful.")

if __name__ == "__main__":
    truncate_users()
