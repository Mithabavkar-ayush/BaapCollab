from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from database import engine, User, AuditLog
from auth_utils import get_current_user
from email_utils import send_role_update_email, send_promotion_confirmation_email
from ws_manager import manager
import asyncio

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    email: str
    role: str
    is_banned: bool
    is_suspended: bool
    suspended_until: Optional[datetime]
    is_verified: bool
    is_approved: bool

class RoleUpdate(BaseModel):
    role: str

class BanUpdate(BaseModel):
    ban: bool

class SuspendUpdate(BaseModel):
    suspend: bool
    days: Optional[int] = None

def log_audit(session: Session, action: str, performed_by: int, target_user: int, details: Optional[str] = None):
    try:
        log_entry = AuditLog(
            action=action,
            performed_by=performed_by,
            target_user=target_user,
            details=details
        )
        session.add(log_entry)
        session.commit()
    except Exception as e:
        print(f"Silent Error writing audit log: {e}")
        session.rollback()

def superadmin_only(current_user: User = Depends(get_current_user)):
    if current_user.role != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
    return current_user

def admin_or_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
    return current_user

@router.get("/users", response_model=List[UserResponse])
def get_admin_users(current_user: User = Depends(admin_or_superadmin)):
    with Session(engine) as session:
        query = select(User).where(User.role != "SUPERADMIN")
        if current_user.role == "ADMIN":
            query = query.where(User.role == "STUDENT")
        users = session.exec(query).all()
        return users

@router.patch("/users/{user_id}/role")
def update_role(user_id: int, request: RoleUpdate, background_tasks: BackgroundTasks, current_user: User = Depends(superadmin_only)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role.")
    if request.role not in ["ADMIN", "STUDENT"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
        
    with Session(engine) as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
        if target.role == "SUPERADMIN":
            raise HTTPException(status_code=400, detail="Cannot modify SUPERADMIN role.")
            
        old_role = target.role
        target.role = request.role
        session.add(target)
        session.commit()
        
        action = "PROMOTE" if request.role == "ADMIN" else "DEMOTE"
        log_audit(session, action, current_user.id, target.id, f"Role changed from {old_role} to {request.role}")
        
        # Send Email to Target
        background_tasks.add_task(send_role_update_email, target.email, target.name or 'User', request.role)
        
        # Send Email to Superadmin
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        background_tasks.add_task(send_promotion_confirmation_email, current_user.email, target.name or 'User', target.email, request.role, timestamp_str)

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_json({
                "type": "role_update",
                "user_id": target.id,
                "new_role": request.role
            }))
        except RuntimeError:
            pass # fallback if not in event loop

        return {"message": "Role successfully updated."}

@router.patch("/users/{user_id}/ban")
def update_ban(user_id: int, request: BanUpdate, current_user: User = Depends(superadmin_only)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself.")
        
    with Session(engine) as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
        if target.role == "SUPERADMIN":
            raise HTTPException(status_code=400, detail="Cannot ban a SUPERADMIN.")
            
        if request.ban:
            target.is_banned = True
            target.is_suspended = False
            target.suspended_until = None
            action = "BAN"
        else:
            target.is_banned = False
            action = "UNBAN"

        session.add(target)
        session.commit()
        
        log_audit(session, action, current_user.id, target.id)
        return {"message": f"User successfully {action.lower()}ned."}

@router.patch("/users/{user_id}/suspend")
def update_suspend(user_id: int, request: SuspendUpdate, current_user: User = Depends(superadmin_only)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself.")
        
    with Session(engine) as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
        if target.role == "SUPERADMIN":
            raise HTTPException(status_code=400, detail="Cannot suspend a SUPERADMIN.")
            
        if request.suspend:
            if request.days is None or request.days <= 0:
                raise HTTPException(status_code=400, detail="Please specify valid number of days to suspend.")
            target.is_suspended = True
            target.suspended_until = datetime.now(timezone.utc) + timedelta(days=request.days)
            action = "SUSPEND"
            details = f"Suspended for {request.days} days"
        else:
            target.is_suspended = False
            target.suspended_until = None
            action = "UNSUSPEND"
            details = ""

        session.add(target)
        session.commit()
        
        log_audit(session, action, current_user.id, target.id, details)
        return {"message": f"User successfully {action.lower()}ed."}

@router.post("/users/{user_id}/approve")
def approve_new_user(user_id: int, current_user: User = Depends(admin_or_superadmin)):
    from email_utils import send_access_granted
    with Session(engine) as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
            
        if target.rejection_handled:
            raise HTTPException(status_code=400, detail="This request has already been resolved.")

        target.is_approved = True
        target.rejection_handled = True
        session.add(target)
        session.commit()
        
        log_audit(session, "APPROVE_USER", current_user.id, target.id)
        send_access_granted(target.email)

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_json({
                "type": "approval_update",
                "user_id": target.id,
                "status": "approved",
                "acted_by": current_user.name
            }))
        except RuntimeError:
            pass

        return {"message": "User approved successfully."}

@router.post("/users/{user_id}/reject")
def reject_new_user(user_id: int, current_user: User = Depends(admin_or_superadmin)):
    with Session(engine) as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
            
        if target.rejection_handled:
            raise HTTPException(status_code=400, detail="This request has already been resolved.")

        target.is_approved = False
        target.rejection_handled = True
        session.add(target)
        session.commit()
        
        log_audit(session, "REJECT_USER", current_user.id, target.id)

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_json({
                "type": "approval_update",
                "user_id": target.id,
                "status": "rejected",
                "acted_by": current_user.name
            }))
        except RuntimeError:
            pass

        return {"message": "User rejected successfully."}

@router.patch("/users/{user_id}/welcome-seen")
def update_welcome_seen(user_id: int, current_user: User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot modify someone else's welcome status.")
    with Session(engine) as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
        target.has_seen_admin_welcome = True
        session.add(target)
        session.commit()
        return {"message": "Welcome status updated."}
