from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc, func
from database import engine, User, RewardLog, Comment
from typing import List

router = APIRouter()

@router.get("/leaderboard")
def get_leaderboard():
    with Session(engine) as session:
        # User and RewardLog INNER JOIN to aggregate real-time points.
        # This fulfills the request for an explicit INNER JOIN between Users and Points.
        statement = (
            select(User, func.sum(RewardLog.points).label("total_points"))
            .join(RewardLog, User.id == RewardLog.user_id)
            .group_by(User.id)
            .order_by(desc("total_points"))
            .limit(10)
        )
        results = session.exec(statement).all()
        
        # If no reward logs exist yet, fall back to simple user points list to ensure UI isn't empty
        if not results:
            users = session.exec(select(User).order_by(desc(User.reward_points)).limit(10)).all()
            results = [(u, u.reward_points) for u in users]

        final_result = []
        for u, points in results:
            # Derive display name: Google Name -> Email Prefix -> "Helper"
            if u.name and u.name.strip():
                display_name = u.name
            elif u.email:
                display_name = u.email.split("@")[0].replace(".", " ").title()
            else:
                display_name = "Helper"
                
            final_result.append({
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "display_name": display_name,
                "picture": u.picture,
                "reward_points": points or 0,
                "department": u.department,
                "branch_id": u.branch_id,
            })
        return final_result

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
