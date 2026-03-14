from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import engine, Post, User, Comment, CommentUpvote, RewardLog, ProjectApplicant
from typing import Optional
from auth_utils import get_current_user
from pydantic import BaseModel

router = APIRouter()

def get_display_name(user) -> str:
    """Return the user's name or a clean display name derived from their email."""
    if not user:
        return "Unknown"
    if user.name:
        return user.name
    return user.email.split("@")[0].replace(".", " ").title()

class PostCreate(BaseModel):
    title: str
    content: str
    type: str = "FORUM"

class CommentCreate(BaseModel):
    content: str

class CommentUpdate(BaseModel):
    content: str

@router.post("/")
def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        db_post = Post(
            title=post_data.title,
            content=post_data.content,
            type=post_data.type,
            author_id=current_user.id
        )
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        return db_post

@router.get("/")
def get_posts(type: Optional[str] = None, current_user_id: Optional[int] = None):
    with Session(engine) as session:
        statement = select(Post)
        if type:
            statement = statement.where(Post.type == type)
        results = session.exec(statement).all()

        posts_with_authors = []
        for post in results:
            post_dict = post.model_dump()
            post_dict["author_name"] = get_display_name(post.author)
            post_dict["author_picture"] = post.author.picture if post.author else None
            post_dict["comment_count"] = len(post.comments) if post.comments else 0
            
            # Check if current user has applied
            if current_user_id:
                post_dict["has_applied"] = any(applicant.user_id == current_user_id for applicant in post.applicants)
            else:
                post_dict["has_applied"] = False
                
            posts_with_authors.append(post_dict)

        return posts_with_authors

@router.delete("/{post_id}")
def delete_post(post_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        if post.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")

        # Delete upvotes on comments, then comments, then post
        comments = session.exec(select(Comment).where(Comment.post_id == post_id)).all()
        for comment in comments:
            upvotes = session.exec(select(CommentUpvote).where(CommentUpvote.comment_id == comment.id)).all()
            for uv in upvotes:
                session.delete(uv)
            session.delete(comment)
        # Delete project applicants
        applicants = session.exec(select(ProjectApplicant).where(ProjectApplicant.post_id == post_id)).all()
        for applicant in applicants:
            session.delete(applicant)

        session.delete(post)
        session.commit()
        return {"message": "Post deleted successfully"}

@router.get("/{post_id}/comments")
def get_comments(post_id: int, current_user_id: Optional[int] = None):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        comments = session.exec(select(Comment).where(Comment.post_id == post_id)).all()
        comments_with_data = []
        for comment in comments:
            comment_dict = comment.model_dump()
            author = session.get(User, comment.author_id)
            comment_dict["author_name"] = get_display_name(author)
            comment_dict["author_picture"] = author.picture if author else None

            # Upvote data
            upvotes = session.exec(select(CommentUpvote).where(CommentUpvote.comment_id == comment.id)).all()
            comment_dict["upvote_count"] = len(upvotes)
            # Whether the requesting user has upvoted (passed as query param for public endpoint)
            if current_user_id:
                comment_dict["user_has_upvoted"] = any(uv.voter_id == current_user_id for uv in upvotes)
            else:
                comment_dict["user_has_upvoted"] = False

            comments_with_data.append(comment_dict)

        return comments_with_data

@router.post("/{post_id}/comments")
def create_comment(post_id: int, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        db_comment = Comment(
            content=comment_data.content,
            post_id=post_id,
            author_id=current_user.id
        )
        session.add(db_comment)
        session.commit()
        session.refresh(db_comment)

        comment_dict = db_comment.model_dump()
        comment_dict["author_name"] = get_display_name(current_user)
        comment_dict["author_picture"] = current_user.picture or None
        comment_dict["upvote_count"] = 0
        comment_dict["user_has_upvoted"] = False
        return comment_dict

@router.patch("/{post_id}/comments/{comment_id}")
def update_comment(post_id: int, comment_id: int, comment_data: CommentUpdate, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        comment = session.get(Comment, comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Ownership check — only the author can edit
        if comment.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this assist")
            
        comment.content = comment_data.content
        session.add(comment)
        session.commit()
        session.refresh(comment)
        
        # Return same structure as create_comment
        comment_dict = comment.model_dump()
        comment_dict["author_name"] = get_display_name(current_user)
        comment_dict["author_picture"] = current_user.picture or None
        
        upvotes = session.exec(select(CommentUpvote).where(CommentUpvote.comment_id == comment_id)).all()
        comment_dict["upvote_count"] = len(upvotes)
        comment_dict["user_has_upvoted"] = any(uv.voter_id == current_user.id for uv in upvotes)
        
        return comment_dict

@router.delete("/{post_id}/comments/{comment_id}")
def delete_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
            
        comment = session.get(Comment, comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
            
        # Ownership check: only comment author or post author can delete
        if comment.author_id != current_user.id and post.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this assist")
            
        # Clean up upvotes first
        upvotes = session.exec(select(CommentUpvote).where(CommentUpvote.comment_id == comment_id)).all()
        for uv in upvotes:
            session.delete(uv)
            
        session.delete(comment)
        session.commit()
        return {"message": "Assist deleted successfully"}

@router.post("/{post_id}/comments/{comment_id}/upvote")
def toggle_upvote(post_id: int, comment_id: int, current_user: User = Depends(get_current_user)):
    """Toggle upvote on a comment. Returns new count and whether user has upvoted."""
    with Session(engine) as session:
        comment = session.get(Comment, comment_id)
        if not comment or comment.post_id != post_id:
            raise HTTPException(status_code=404, detail="Comment not found")

        # Can't upvote your own comment
        if int(comment.author_id) == int(current_user.id):
            print(f"REJECTED: User {current_user.id} tried to upvote their own comment {comment_id}")
            raise HTTPException(status_code=400, detail="Cannot upvote your own comment")

        # Can't upvote if you're the post author
        post = session.get(Post, post_id)
        if post and int(post.author_id) == int(current_user.id):
            print(f"REJECTED: Post owner {current_user.id} tried to upvote comment {comment_id} on their post {post_id}")
            raise HTTPException(status_code=400, detail="Post owner cannot upvote comments on their own topic")

        # Can't upvote a comment if the comment author is the post author (Exclusion Logic)
        if post and int(comment.author_id) == int(post.author_id):
            print(f"REJECTED: User {current_user.id} tried to upvote post owner's comment {comment_id}")
            raise HTTPException(status_code=400, detail="Cannot upvote the topic owner's replies")

        # Check if already upvoted
        existing = session.exec(
            select(CommentUpvote).where(
                CommentUpvote.comment_id == comment_id,
                CommentUpvote.voter_id == current_user.id
            )
        ).first()

        if existing:
            # Un-upvote: remove vote and deduct points from author
            session.delete(existing)
            author = session.get(User, comment.author_id)
            if author and author.reward_points >= 5:
                author.reward_points -= 5
                # Log the deduction for the leaderboard INNER JOIN
                log = RewardLog(
                    user_id=author.id,
                    points=-5,
                    reason=f"Upvote removed from comment #{comment_id}"
                )
                session.add(author)
                session.add(log)
            upvoted = False
        else:
            # Upvote: add vote and give +5 points to comment author
            new_upvote = CommentUpvote(comment_id=comment_id, voter_id=current_user.id)
            session.add(new_upvote)

            author = session.get(User, comment.author_id)
            if author:
                author.reward_points += 5
                reward_log = RewardLog(
                    user_id=author.id,
                    points=5,
                    reason=f"Upvote received on comment #{comment_id}"
                )
                session.add(author)
                session.add(reward_log)
            upvoted = True

        session.commit()

        # Return updated count
        upvote_count = session.exec(
            select(CommentUpvote).where(CommentUpvote.comment_id == comment_id)
        ).all()

        return {
            "comment_id": comment_id,
            "upvote_count": len(upvote_count),
            "user_has_upvoted": upvoted
        }

@router.post("/{post_id}/apply")
def apply_to_project(post_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post or post.type != "LFM":
            raise HTTPException(status_code=404, detail="Project not found")
            
        if post.author_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot apply to your own project")
            
        existing = session.exec(
            select(ProjectApplicant).where(
                ProjectApplicant.post_id == post_id,
                ProjectApplicant.user_id == current_user.id
            )
        ).first()
        
        if existing:
            # Idempotent: already enrolled, just return success
            return {"message": "Already enrolled in this project", "has_applied": True}
            
        applicant = ProjectApplicant(post_id=post_id, user_id=current_user.id)
        session.add(applicant)
        session.commit()
        return {"message": "Successfully applied to project", "has_applied": True}

@router.delete("/{post_id}/apply")
def unenroll_from_project(post_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Project not found")
            
        existing = session.exec(
            select(ProjectApplicant).where(
                ProjectApplicant.post_id == post_id,
                ProjectApplicant.user_id == current_user.id
            )
        ).first()
        
        if not existing:
            raise HTTPException(status_code=400, detail="Not enrolled in this project")
            
        session.delete(existing)
        session.commit()
        return {"message": "Successfully unenrolled from project", "has_applied": False}

@router.get("/{post_id}/applicants")
def get_project_applicants(post_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        post = session.get(Post, post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if post.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view applicants")
            
        applicants = session.exec(select(ProjectApplicant).where(ProjectApplicant.post_id == post_id)).all()
        
        applicant_data = []
        for app in applicants:
            user = session.get(User, app.user_id)
            if user:
                applicant_data.append({
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "picture": user.picture
                })
                
        return applicant_data
