from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session, select
from dotenv import load_dotenv
import os

# Load environment variables (don't override existing ones)
load_dotenv(override=False)

database_url = os.getenv("DATABASE_URL")

# Fix for Railway/Render/Heroku where postgres:// is used instead of postgresql://
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

print(f"DEBUG: DATABASE_URL check -> {'Found' if database_url else 'Not Found'}")

if not database_url:
    print("CRITICAL: DATABASE_URL is missing! Falling back to SQLite...")
    database_url = "sqlite:///./fallback.db"

connect_args = {}
if database_url.startswith("sqlite"):
    print(f"WARNING: RUNNING ON SQLITE. Connection: {database_url}")
    connect_args = {"check_same_thread": False}
else:
    db_host = database_url.split("@")[-1] if "@" in database_url else database_url
    print(f"SUCCESS: CONNECTING TO POSTGRESQL -> {db_host}")
    # Explicitly handle SSL for production
    if "sslmode" not in database_url:
        if "?" in database_url:
            database_url += "&sslmode=require"
        else:
            database_url += "?sslmode=require"

engine = create_engine(database_url, echo=False, connect_args=connect_args)

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
    has_seen_welcome: bool = Field(default=False)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    branch: Optional[Branch] = Relationship(back_populates="users")
    posts: List["Post"] = Relationship(back_populates="author")
    reward_logs: List["RewardLog"] = Relationship(back_populates="user")
    comment_upvotes: List["CommentUpvote"] = Relationship(back_populates="voter")
    applications: List["ProjectApplicant"] = Relationship(back_populates="user")

from datetime import datetime, timezone

class PostBase(SQLModel):
    title: str
    content: str
    type: str = Field(default="FORUM") # FORUM or LFM
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Post(PostBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author: User = Relationship(back_populates="posts")
    comments: List["Comment"] = Relationship(back_populates="post")
    applicants: List["ProjectApplicant"] = Relationship(back_populates="post")

class CommentBase(SQLModel):
    content: str
    is_helpful: bool = Field(default=False)
    post_id: int = Field(foreign_key="post.id")
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Comment(CommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post: Post = Relationship(back_populates="comments")
    upvotes: List["CommentUpvote"] = Relationship(back_populates="comment")

class CommentUpvote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    comment_id: int = Field(foreign_key="comment.id")
    voter_id: int = Field(foreign_key="user.id")
    comment: Optional[Comment] = Relationship(back_populates="upvotes")
    voter: Optional[User] = Relationship(back_populates="comment_upvotes")

class ProjectApplicant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    user_id: int = Field(foreign_key="user.id")
    post: Optional["Post"] = Relationship(back_populates="applicants")
    user: Optional["User"] = Relationship(back_populates="applications")

class RewardLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    points: int
    reason: str
    user: User = Relationship(back_populates="reward_logs")

def create_db_and_tables():
    print("DEBUG: Starting database initialization (create_all)...")
    try:
        SQLModel.metadata.create_all(engine)
        print("DEBUG: Database initialization completed successfully.")
    except Exception as e:
        print(f"CRITICAL ERROR during database initialization: {e}")
        # Re-raise to crash if it's truly fatal, but at least we see the log
        raise e

