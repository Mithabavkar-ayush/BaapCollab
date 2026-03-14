from sqlmodel import Session, select
from database import engine, Branch

SUPPORTED_BRANCHES = [
    { "id": 1, "name": "Sant Monica School, Vaijapur" },
    { "id": 2, "name": "Dhangarwadi Zilla Parishad School" },
    { "id": 3, "name": "Raytechi Shala (Ware Guruji Model School)" },
    { "id": 4, "name": "Paregaon Village School (FutureX Lab)" },
    { "id": 5, "name": "The Baap Company - BCA Program" },
    { "id": 6, "name": "The Baap Company - MCA Program" },
    { "id": 7, "name": "The Baap Company - 11th & 12th (Science)" },
    { "id": 8, "name": "The Baap Company - Diploma Science" },
    { "id": 9, "name": "The Baap Company - Paregaon" },
    { "id": 10, "name": "The Baap Company - Selu" }
]

def seed():
    with Session(engine) as session:
        for b_data in SUPPORTED_BRANCHES:
            # Check if exists
            existing = session.get(Branch, b_data["id"])
            if not existing:
                print(f"Seeding: {b_data['name']}")
                branch = Branch(id=b_data["id"], name=b_data["name"])
                session.add(branch)
            else:
                print(f"Skipping (Already exists): {b_data['name']}")
        
        session.commit()
        print("Done!")

if __name__ == "__main__":
    seed()
