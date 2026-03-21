from sqlmodel import Session, select
from database import engine, User, Branch
from email_utils import send_approval_request

def trigger_manual_email(email):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            print(f"User {email} not found.")
            return
            
        branch_name = user.branch.name if user.branch else "The Baap Company - BCA Program"
        print(f"Triggering high-fidelity card for {user.name} ({user.email})...")
        
        success = send_approval_request(
            user.email,
            branch_name,
            user.id,
            user.name or user.email,
            user.bio or "BaapCollab Builder",
            user.department or "Computer Science",
            str(user.graduation_year or "2026"),
            user.skills or "Python, React, SQLModel",
            user.linkedin_url or "NA",
            user.github_url or "NA"
        )
        
        if success:
            print("✅ Email sent! Check your Gmail (including Spam just in case).")
        else:
            print("❌ Failed to send email.")

if __name__ == "__main__":
    trigger_manual_email("ayushmith249@gmail.com")
