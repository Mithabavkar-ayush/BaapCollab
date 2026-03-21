import os
from sqlmodel import Session, SQLModel, create_engine, select
from database import Branch, engine
from dotenv import load_dotenv

load_dotenv()

def seed():
    branches_to_seed = [
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

    with Session(engine) as session:
        print("Checking for existing branches...")
        existing_count = session.exec(select(Branch)).all()
        print(f"Found {len(existing_count)} branches.")

        for b_data in branches_to_seed:
            existing = session.get(Branch, b_data["id"])
            if not existing:
                print(f"Adding branch: {b_data['name']} (ID: {b_data['id']})")
                new_branch = Branch(**b_data)
                session.add(new_branch)
            else:
                print(f"Branch already exists: {b_data['name']} (ID: {b_data['id']})")
        
        session.commit()
        print("✅ Seeding completed successfully!")

if __name__ == "__main__":
    seed()
