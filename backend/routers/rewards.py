from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc, func
from database import engine, User, RewardLog, Comment
from typing import List

router = APIRouter()

@router.get("/leaderboard")
def get_leaderboard():
    with Session(engine) as session:
        # Use LEFT JOIN (isouter=True) so users with 0 points still show up.
        statement = (
            select(User, func.coalesce(func.sum(RewardLog.points), 0).label("total_points"))
            .join(RewardLog, User.id == RewardLog.user_id, isouter=True)
            .group_by(User.id)
            .order_by(desc("total_points"), User.id)
            .limit(10)
        )
        results = session.exec(statement).all()
        
        # Additional fallback: if somehow results is still empty, get all users
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
