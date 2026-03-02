from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import engine, Post, PostBase, User
from typing import List, Optional

router = APIRouter()

@router.post("/")
def create_post(post: PostBase):
    with Session(engine) as session:
        db_post = Post.from_orm(post)
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post

@router.get("/")
def get_posts(type: Optional[str] = None):
    with Session(engine) as session:
        statement = select(Post)
        if type:
            statement = statement.where(Post.type == type)
        return session.exec(statement).all()
