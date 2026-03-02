from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc
from ..database import engine, User, RewardLog, Comment
from typing import List

router = APIRouter()

@router.get("/leaderboard")
def get_leaderboard():
    with Session(engine) as session:
        return session.exec(select(User).order_by(desc(User.reward_points)).limit(10)).all()

@router.patch("/users/me/tour-completed")
def tour_completed(email: str):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_first_login = False
        session.add(user)
        session.commit()
        return {"status": "success"}
