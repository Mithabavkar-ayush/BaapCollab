from sqlmodel import Session, select
from database import engine, User
from passlib.hash import pbkdf2_sha256
import os

def reseed():
    with Session(engine) as session:
        email = os.getenv("ADMIN_EMAIL", "ayushmith249@gmail.com")
        user = session.exec(select(User).where(User.email == email)).first()
        
        # New Password
        new_password = "admin77" # VERY SHORT
        hashed = pbkdf2_sha256.hash(new_password)
        
        if not user:
            print(f"User {email} not found, creating...")
            user = User(
                email=email,
                name="Ayush Mithabavkar",
                hashed_password=hashed,
                role="SUPERADMIN",
                is_approved=True,
                is_verified=True,
                has_seen_welcome=True
            )
            session.add(user)
        else:
            print(f"User {email} found, updating password to {new_password} and role to SUPERADMIN...")
            user.hashed_password = hashed
            user.role = "SUPERADMIN"
            user.is_approved = True
            user.is_verified = True
            session.add(user)
            
        session.commit()
        print(f"✅ User {email} is ready with role {user.role}")
        print(f"✅ HASH: {hashed[:20]}...")

if __name__ == "__main__":
    reseed()
