from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc
from database import engine, Notification, User
from auth_utils import get_current_user
from typing import List

router = APIRouter()

@router.get("")
def get_notifications(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(Notification).where(Notification.user_id == current_user.id).order_by(desc(Notification.created_at)).limit(50)
        results = session.exec(statement).all()
        return results

@router.patch("/{notification_id}/read")
def mark_as_read(notification_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        notification = session.get(Notification, notification_id)
        if not notification or notification.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Notification not found")
        notification.is_read = True
        session.add(notification)
        session.commit()
        return {"status": "success"}

@router.patch("/read-all")
def mark_all_as_read(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
        unread = session.exec(statement).all()
        for n in unread:
            n.is_read = True
            session.add(n)
        session.commit()
        return {"status": "success", "count": len(unread)}

def create_notification(session: Session, user_id: int, title: str, message: str, type: str):
    """Internal helper to create a notification within an existing session transaction."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )
    session.add(notification)
    return notification
