from sqlmodel import Session, select
from database import engine, User
from auth_utils import get_password_hash

def reseed():
    with Session(engine) as session:
        email = "ayushmith249@gmail.com"
        user = session.exec(select(User).where(User.email == email)).first()
        
        if not user:
            print(f"User {email} not found, creating...")
            user = User(
                email=email,
                name="Ayush Mithabavkar",
                hashed_password=get_password_hash("admin123"), # Default password
                role="SUPERADMIN",
                is_approved=True,
                is_verified=True,
                has_seen_welcome=True
            )
            session.add(user)
        else:
            print(f"User {email} found, updating password and role...")
            user.hashed_password = get_password_hash("admin123")
            user.role = "SUPERADMIN"
            user.is_approved = True
            user.is_verified = True
            session.add(user)
            
        session.commit()
        print(f"✅ User {email} is ready with role {user.role}")

if __name__ == "__main__":
    reseed()
