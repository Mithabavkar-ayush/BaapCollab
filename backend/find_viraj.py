from sqlmodel import Session, select
from database import engine, User, Post, Comment

def find_user(email_query):
    with Session(engine) as session:
        # Try exact match
        user = session.exec(select(User).where(User.email == email_query)).first()
        if user:
            print(f"FOUND EXACT: ID={user.id}, Email={user.email}, Name={user.name}")
            return user.id
            
        # Try partial match if not found
        print(f"No exact match for {email_query}. Checking partials...")
        users = session.exec(select(User)).all()
        for u in users:
            if email_query.lower() in u.email.lower() or (u.name and email_query.lower() in u.name.lower()):
                print(f"POTENTIAL MATCH: ID={u.id}, Email={u.email}, Name={u.name}")
        return None

if __name__ == "__main__":
    find_user("virajparhad004@gmail.com")
