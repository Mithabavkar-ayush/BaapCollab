import sys
import os
sys.path.append(os.getcwd())

try:
    from sqlmodel import Session, select, func
    from database import engine, Post, User
    
    with Session(engine) as session:
        count = session.exec(select(func.count()).select_from(Post)).one()
        print(f"Total Posts in DB: {count}")
        
        # Check if there are users too
        u_count = session.exec(select(func.count()).select_from(User)).one()
        print(f"Total Users in DB: {u_count}")
        
except Exception as e:
    print(f"Error checking database: {e}")
