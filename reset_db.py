from sqlmodel import SQLModel, Session, create_engine
from backend.database import engine, Branch

def reset_db():
    print("Dropping and recreating all tables...")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        print("Adding initial branches...")
        branches = [
            Branch(name="Main Campus"),
            Branch(name="Engineering Wing"),
            Branch(name="Business School"),
            Branch(name="Arts & Science")
        ]
        session.add_all(branches)
        session.commit()
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()
