import os
from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session, select
from sqlalchemy import Column, DateTime, func, Boolean
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Fix Neon/Heroku postgres:// prefix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {"sslmode": "require"}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

class Branch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    users: List["User"] = Relationship(back_populates="branch")

class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    name: Optional[str] = Field(default=None, max_length=255)
    picture: Optional[str] = Field(default=None, max_length=255)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    department: Optional[str] = Field(default=None, max_length=255)
    graduation_year: Optional[int] = None
    skills: Optional[str] = Field(default=None, max_length=255)
    bio: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255)
    github_url: Optional[str] = Field(default=None, max_length=255)
    reward_points: int = Field(default=0)
    is_first_login: bool = Field(default=True)
    is_approved: bool = Field(default=False)
    has_seen_welcome: bool = Field(default=False)
    hashed_password: Optional[str] = Field(default=None)
    is_verified: bool = Field(default=False)
    otp_code: Optional[str] = Field(default=None)
    is_banned: bool = Field(default=False)
    is_suspended: bool = Field(default=False)
    suspended_until: Optional[datetime] = Field(default=None)
    rejection_handled: bool = Field(default=False)
    role: str = Field(default="STUDENT") # STUDENT, ADMIN, SUPERADMIN

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    branch: Optional[Branch] = Relationship(back_populates="users")
    posts: List["Post"] = Relationship(back_populates="author")
    reward_logs: List["RewardLog"] = Relationship(back_populates="user")
    comment_upvotes: List["CommentUpvote"] = Relationship(back_populates="voter")
    applications: List["ProjectApplicant"] = Relationship(back_populates="user")

class PostBase(SQLModel):
    title: str
    content: str
    type: str = Field(default="FORUM") # FORUM or LFM
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
        default_factory=lambda: datetime.now(timezone.utc)
    )

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
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
        default_factory=lambda: datetime.now(timezone.utc)
    )

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

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    action: str
    performed_by: int = Field(foreign_key="user.id")
    target_user: int = Field(foreign_key="user.id")
    timestamp: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
        default_factory=lambda: datetime.now(timezone.utc)
    )
    details: Optional[str] = Field(default=None)

def create_db_and_tables():
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ Database Connected Successfully — Tables created")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        raise

def get_session():
    with Session(engine) as session:
        yield session

