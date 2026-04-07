from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc
from database import engine, Notification, User
from auth_utils import get_current_user
from typing import List, Optional

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

@router.delete("/clear-all")
def clear_all_notifications(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        statement = select(Notification).where(Notification.user_id == current_user.id)
        notifications = session.exec(statement).all()
        for n in notifications:
            session.delete(n)
        session.commit()
        return {"status": "success", "count": len(notifications)}

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        notification = session.get(Notification, notification_id)
        if not notification or notification.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Notification not found")
        session.delete(notification)
        session.commit()
        return {"status": "success"}

def create_notification(session: Session, user_id: int, title: str, message: str, type: str, related_id: Optional[int] = None):
    """Internal helper to create a notification within an existing session transaction."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        related_id=related_id
    )
    session.add(notification)
    return notification
