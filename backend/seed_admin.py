from sqlmodel import Session, select
from database import engine, User, Branch, create_db_and_tables

def seed_data():
    create_db_and_tables()
    with Session(engine) as session:
        # Seed Branches
        branches = [
            {"id": 1, "name": "Sant Monica School, Vaijapur"},
            {"id": 2, "name": "Dhangarwadi Zilla Parishad School"},
            {"id": 3, "name": "Raytechi Shala (Ware Guruji Model School)"},
            {"id": 4, "name": "Paregaon Village School (FutureX Lab)"},
            {"id": 5, "name": "The Baap Company - BCA Program"},
            {"id": 6, "name": "The Baap Company - MCA Program"},
            {"id": 7, "name": "The Baap Company - 11th & 12th (Science)"},
            {"id": 8, "name": "The Baap Company - Diploma Science"},
            {"id": 9, "name": "The Baap Company - Paregaon"},
            {"id": 10, "name": "The Baap Company - Selu"}
        ]
        
        for b_data in branches:
            existing = session.get(Branch, b_data["id"])
            if not existing:
                print(f"Adding branch: {b_data['name']}")
                branch = Branch(**b_data)
                session.add(branch)
        
        session.commit()

        admin_email = "ayushmith249@gmail.com"
        admin = session.exec(select(User).where(User.email == admin_email)).first()
        if not admin:
            print(f"Adding admin user {admin_email}...")
            admin = User(
                email=admin_email,
                name="Ayush Mithabavkar",
                is_approved=True,
                is_first_login=False,
                has_seen_welcome=True
            )
            session.add(admin)
            session.commit()
            print("Admin user added successfully.")
        else:
            print(f"Admin user {admin_email} already exists.")

if __name__ == "__main__":
    seed_data()
