from sqlmodel import Session, select
from database import engine, User

def set_superadmin(email: str):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            user.role = "SUPERADMIN"
            user.is_approved = True
            user.is_verified = True
            session.add(user)
            session.commit()
            print(f"✅ User {email} is now SUPERADMIN and fully approved.")
        else:
            print(f"❌ User {email} not found.")

if __name__ == "__main__":
    set_superadmin("ayushmith249@gmail.com")
