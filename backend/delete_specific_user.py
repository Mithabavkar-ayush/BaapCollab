import os
from sqlalchemy import text
from sqlmodel import Session
from database import engine

def delete_target_user():
    print("Connecting to database...")
    with Session(engine) as session:
        print("Executing DELETE for ayushmith249@gmail.com...")
        session.exec(text("DELETE FROM \"user\" WHERE email = 'ayushmith249@gmail.com';"))
        session.commit()
        print("User deleted successfully (if they existed).")

if __name__ == "__main__":
    delete_target_user()
