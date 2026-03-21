from sqlmodel import Session, select, create_engine
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OTHER_DB = os.path.join(BASE_DIR, "the baap collab", "backend", "baap_collab.db")
engine = create_engine(f"sqlite:///{OTHER_DB}")
from database import User

def find_user(email):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            print(f"ID: {user.id}")
            print(f"Name: {user.name}")
            print(f"Email: {user.email}")
            print(f"Approved: {user.is_approved}")
            print(f"Branch ID: {user.branch_id}")
            print(f"Department: {user.department}")
            print(f"Grad Year: {user.graduation_year}")
            print(f"Skills: {user.skills}")
            print(f"Bio: {user.bio}")
        else:
            print("User not found in this database.")

if __name__ == "__main__":
    find_user("avatameta67@gmail.com")
