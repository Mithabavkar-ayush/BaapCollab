from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..database import engine, User, Branch
from ..auth_utils import create_access_token, get_current_user
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
def google_auth(request: GoogleLoginRequest):
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

class ProfileDetails(BaseModel):
    name: Optional[str] = None
    department: str
    graduation_year: int
    skills: str
    bio: str

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
        user.is_first_login = True # Ensure guide shows up
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
