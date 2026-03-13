from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from database import engine, User, Branch
from auth_utils import create_access_token, get_current_user
from typing import Optional
from pydantic import BaseModel
from datetime import timedelta

from google.oauth2 import id_token
from google.auth.transport import requests
import os
from dotenv import load_dotenv

# Replace with your actual Google Client ID
GOOGLE_CLIENT_ID = "735745260532-2c2nmc7s92j25o0fl0p5a1itoauv30u0.apps.googleusercontent.com"

print(f"CRITICAL DEBUG: Using HARDCODED Client ID: {GOOGLE_CLIENT_ID[:20]}...")

router = APIRouter()

class GoogleLoginRequest(BaseModel):
    credential: str

@router.post("/google")
def google_auth(request: GoogleLoginRequest, response: Response):
    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(request.credential, requests.Request(), GOOGLE_CLIENT_ID)
        
        # ID token is valid. Get the user's Google ID from the decoded token.
        email = idinfo['email']
        name = idinfo.get('name')
        picture = idinfo.get('picture')
    except ValueError as e:
        # Invalid token
        print(f"Google Token Verification Failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Google token: {str(e)}")
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            user = User(email=email, name=name, picture=picture)
            session.add(user)
            session.commit()
            session.refresh(user)
        
        # Create a real JWT token
        access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Set HttpOnly cookie - Production Ready
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=60 * 60 * 24 * 7, # 7 days
            samesite="none", # Required for cross-site cookies
            secure=True,     # Required for samesite="none"
        )
        
        return {
            "token": access_token,
            "user": user,
            "requires_onboarding": user.branch_id is None
        }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/branches")
def get_branches():
    with Session(engine) as session:
        return session.exec(select(Branch)).all()

@router.post("/onboarding/institute")
def select_institute(branch_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # User is already verified via current_user dependency
        user = session.exec(select(User).where(User.email == current_user.email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.branch_id = branch_id
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

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
def complete_profile(details: ProfileDetails, current_user: User = Depends(get_current_user)):
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
        user.is_first_login = True # Ensure guide shows up initially
        session.add(user)
        session.commit()
        session.refresh(user)
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
            "reward_points": user.reward_points
        }
