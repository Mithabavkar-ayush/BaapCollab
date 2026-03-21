from sqlmodel import Session, select
from database import engine, User

def list_all_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        print(f"Total Users: {len(users)}")
        for user in users:
            print(f"ID: {user.id} | Email: {user.email} | Name: {user.name} | Approved: {user.is_approved}")

if __name__ == "__main__":
    list_all_users()
