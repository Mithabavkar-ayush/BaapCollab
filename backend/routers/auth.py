from fastapi import APIRouter, Depends, HTTPException, status, Response, BackgroundTasks
from sqlmodel import Session, select
from database import engine, User, Branch
from auth_utils import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from typing import List, Optional
from pydantic import BaseModel
from datetime import timedelta
import os
import random
from dotenv import load_dotenv

# Deployment Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

router = APIRouter()

class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(request: UserSignup, background_tasks: BackgroundTasks):
    from auth_utils import get_password_hash
    from email_utils import send_welcome_otp
    with Session(engine) as session:
        existing_user = session.exec(select(User).where(User.email == request.email)).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists. Please sign in.")
        
        otp = str(random.randint(100000, 999999))
        hashed_password = get_password_hash(request.password)
        user = User(
            email=request.email,
            hashed_password=hashed_password,
            is_approved=True,  # TEMPORARY BYPASS: Pre-approve for production debug
            is_verified=True,  # TEMPORARY BYPASS: Pre-verify for production debug
            otp_code=otp,
            role="STUDENT"
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        background_tasks.add_task(send_welcome_otp, request.email, otp)

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "branch_id": user.branch_id,
                "department": user.department,
                "is_approved": user.is_approved,
                "is_verified": user.is_verified,
                "has_seen_welcome": user.has_seen_welcome,
                "reward_points": user.reward_points,
                "picture": user.picture,
                "profile_pic_url": user.picture,
                "role": user.role,
            },
            "requires_onboarding": True,
            "otp_sent": True,
        }

class OTPVerify(BaseModel):
    email: str
    otp: str

@router.post("/verify-otp")
def verify_otp(req: OTPVerify):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == req.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        if not user.otp_code or user.otp_code != req.otp:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
        user.is_verified = True
        user.otp_code = None
        session.add(user)
        session.commit()
        return {"message": "Email verified successfully!", "is_verified": True}


@router.post("/login")
def login(request: UserLogin, response: Response):
    from auth_utils import verify_password
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == request.email)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please sign up first.",
            )
        print(f"DEBUG: Login attempt for {request.email}")
        if not user.hashed_password:
            print(f"DEBUG: User {request.email} has NO hashed_password set!")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account is not fully set up. Please try resetting your password.",
            )
        
        is_valid = verify_password(request.password, user.hashed_password)
        print(f"DEBUG: Password verification result for {request.email}: {is_valid}")
        if not is_valid:
            # Check if the hash looks like a certain format
            hash_prefix = user.hashed_password[:10] if user.hashed_password else "None"
            print(f"DEBUG: Hash prefix for {request.email}: {hash_prefix}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=60 * 24 * 7)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        is_production = os.getenv("RAILWAY_ENVIRONMENT") is not None or os.getenv("ENV") == "production"
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=60 * 60 * 24 * 7,
            samesite="lax",
            secure=is_production,
        )
        
        return {
            "token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "branch_id": user.branch_id,
                "department": user.department,
                "is_approved": user.is_approved,
                "has_seen_welcome": user.has_seen_welcome,
                "reward_points": user.reward_points,
                "picture": user.picture,
                "profile_pic_url": user.picture,
                "role": user.role,
            },
            "requires_onboarding": user.branch_id is None
        }

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    from auth_utils import create_reset_token
    from email_utils import send_password_reset_email
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == req.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="No account found with this email. Please sign up first.")
            
        token = create_reset_token(user.email, user.hashed_password)
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        background_tasks.add_task(send_password_reset_email, user.email, reset_link)
        
        return {"message": "If that email exists in our system, we've sent a password reset link."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    from auth_utils import verify_reset_token, get_password_hash, verify_password
    email = verify_reset_token(req.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The link has expired."
        )
        
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
            
        # Prevent reusing old password
        if user.hashed_password and verify_password(req.new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as your current password."
            )
            
        # Update user's password
        user.hashed_password = get_password_hash(req.new_password)
        session.add(user)
        session.commit()
        
        return {"message": "Password successfully reset. You can now log in."}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/branches")
def get_branches():
    with Session(engine) as session:
        return session.exec(select(Branch)).all()

@router.get("/onboarding/institute")
def onboarding_pulse(current_user: User = Depends(get_current_user)):
    """Simple GET endpoint to verify availability and provide CORS headers."""
    return {"status": "available", "user": current_user.email}

from email_utils import send_approval_request, send_access_granted

@router.post("/onboarding/institute")
def select_institute(branch_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # Check if branch exists
        branch = session.get(Branch, branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail=f"Branch ID {branch_id} not found in database")
            
        user = session.exec(select(User).where(User.email == current_user.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        try:
            user.branch_id = branch_id
            # We don't set is_approved here anymore, we wait for profile completion
            session.add(user)
            session.commit()
            session.refresh(user)
            return user
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=400, detail=f"Failed to update institute: {str(e)}")

@router.get("/admin/approve/{user_id}")
def approve_user(user_id: int):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_approved = True
        session.add(user)
        session.commit()
        
        # Notify user their access is granted
        send_access_granted(user.email)
        
        return {"message": f"User {user.email} has been approved."}

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

@router.patch("/profile")
def update_profile(details: ProfileUpdate, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == current_user.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if details.name is not None:
            user.name = details.name
        if details.department is not None:
            user.department = details.department
        if details.graduation_year is not None:
            user.graduation_year = details.graduation_year
        if details.skills is not None:
            user.skills = details.skills
        if details.bio is not None:
            user.bio = details.bio
        if details.linkedin_url is not None:
            user.linkedin_url = details.linkedin_url
        if details.github_url is not None:
            user.github_url = details.github_url
            
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

@router.post("/welcome-seen")
def complete_welcome(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == current_user.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.has_seen_welcome = True
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"status": "success", "user": user}

@router.post("/guide-complete")
def complete_guide(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == current_user.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_first_login = False
        session.add(user)
        session.commit()
        session.refresh(user)
        return {"status": "success"}

class ProfileDetails(BaseModel):
    name: Optional[str] = None
    department: str
    graduation_year: int
    skills: str
    bio: str
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

@router.post("/onboarding/details")
def complete_profile(details: ProfileDetails, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == current_user.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if details.name:
            user.name = details.name
        user.department = details.department
        user.graduation_year = details.graduation_year
        user.skills = details.skills
        user.bio = details.bio
        user.linkedin_url = details.linkedin_url
        user.github_url = details.github_url
        user.has_seen_welcome = False # Ensure guide shows up initially
        user.is_approved = False      # Atomic Lockdown: Trigger verification mandatory
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Trigger high-fidelity verification email here as a background task
        print(f"DEBUG: Triggering approval email for {user.email} (ID: {user.id})")
        
        # Ensure branch is loaded or handled
        branch_name = "Unknown"
        if user.branch:
            branch_name = user.branch.name
        else:
            # Try to fetch branch manually if relationship isn't hydrated
            branch = session.get(Branch, user.branch_id)
            if branch:
                branch_name = branch.name
                
        print(f"DEBUG: Branch Name for email: {branch_name}")
        
        try:
            background_tasks.add_task(
                send_approval_request,
                user.email, 
                branch_name, 
                user.id, 
                user.name or user.email,
                user.bio or "",
                user.department or "",
                str(user.graduation_year or ""),
                user.skills or "",
                user.linkedin_url or "",
                user.github_url or ""
            )
            print(f"DEBUG: Background task queued for {user.email}")
        except Exception as e:
            print(f"⚠️ Failed to queue verification email: {e}")
        
        return user

@router.get("/profile/{user_id}")
def get_profile(user_id: int):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Return only public information
        return {
            "id": user.id,
            "name": user.name,
            "picture": user.picture,
            "department": user.department,
            "graduation_year": user.graduation_year,
            "skills": user.skills,
            "bio": user.bio,
            "linkedin_url": user.linkedin_url,
            "github_url": user.github_url,
            "reward_points": user.reward_points,
            "role": user.role,
            "profile_pic_url": user.picture,
        }

@router.patch("/admin/role")
def update_user_role(target_email: str, new_role: str, current_user: User = Depends(get_current_user)):
    if not current_user or current_user.role not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if new_role not in ["STUDENT", "ADMIN", "SUPERADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == target_email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.role = new_role
        session.add(user)
        session.commit()
        return {"message": f"User {target_email} role updated to {new_role}", "role": new_role}

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    if not current_user or current_user.role != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only Superadmin can delete users")
    
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        session.delete(user)
        session.commit()
        return {"message": f"User {user.email} deleted successfully"}
