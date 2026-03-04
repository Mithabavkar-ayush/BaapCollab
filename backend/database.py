from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session, select
import os

sqlite_url = "sqlite:///baap_collab.db"
engine = create_engine(sqlite_url, echo=True)

class Branch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    users: List["User"] = Relationship(back_populates="branch")

class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    name: Optional[str] = None
    picture: Optional[str] = None
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    department: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    reward_points: int = Field(default=0)
    is_first_login: bool = Field(default=True)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    branch: Optional[Branch] = Relationship(back_populates="users")
    posts: List["Post"] = Relationship(back_populates="author")
    reward_logs: List["RewardLog"] = Relationship(back_populates="user")

class PostBase(SQLModel):
    title: str
    content: str
    type: str = Field(default="FORUM") # FORUM or LFM
    author_id: int = Field(foreign_key="user.id")

class Post(PostBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author: User = Relationship(back_populates="posts")
    comments: List["Comment"] = Relationship(back_populates="post")

class CommentBase(SQLModel):
    content: str
    is_helpful: bool = Field(default=False)
    post_id: int = Field(foreign_key="post.id")
    author_id: int = Field(foreign_key="user.id")

class Comment(CommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post: Post = Relationship(back_populates="comments")

class RewardLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    points: int
    reason: str
    user: User = Relationship(back_populates="reward_logs")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
