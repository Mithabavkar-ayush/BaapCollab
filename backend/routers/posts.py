from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import engine, Post, User, Comment, CommentUpvote, RewardLog, ProjectApplicant, Notification
from typing import Optional
from auth_utils import get_current_user
from pydantic import BaseModel
from routers.notifications import create_notification
from ws_manager import manager

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

@router.post("")
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    try:
        with Session(engine) as session:
            db_post = Post(
                title=post_data.title,
                content=post_data.content,
                type=post_data.type,
                author_id=current_user.id
            )
            print(f"DEBUG: Attempting to create post '{db_post.title}' for user {current_user.id}")
            session.add(db_post)
            session.commit()
            session.refresh(db_post)
            print(f"DEBUG: ✅ Post created successfully with ID {db_post.id}")

            # Build broadcast payload with author info
            post_dict = db_post.model_dump()
            post_dict["author_name"] = get_display_name(current_user)
            post_dict["author_picture"] = current_user.picture
            post_dict["profile_pic_url"] = current_user.profile_pic_url
            post_dict["comment_count"] = 0
            post_dict["has_applied"] = False

            # Create Notification for ALL verified users except creator
            creator_name = get_display_name(current_user)
            if post_data.type == "LFM":
                title = "New Project Posted"
                message = f"{creator_name} posted a new project: {db_post.title}"
                type_str = "project"
            else:
                title = "New Forum Post"
                message = f"{creator_name} posted in the forum: {db_post.title}"
                type_str = "post"
            
            verified_users = session.exec(select(User).where(User.is_verified == True, User.id != current_user.id)).all()
            for u in verified_users:
                create_notification(session, u.id, title, message, type_str)
            
            # Save all notifications
            session.commit()
            session.refresh(db_post)

            # Broadcast to all connected WebSocket clients
            await manager.broadcast({"type": "new_post", "post": post_dict})

            return db_post
    except Exception as e:
        import traceback
        print(f"❌ CRITICAL ERROR IN create_post: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
def get_posts(type: Optional[str] = None, current_user_id: Optional[int] = None):
    # LOCAL BYPASS: Returning all posts regardless of branch/auth for debugging dashboard
    print(f"DEBUG: Processing get_posts request. Type: {type}, UserID: {current_user_id}")
    try:
        with Session(engine) as session:
            statement = select(Post)
            if type:
                statement = statement.where(Post.type == type)
            results = session.exec(statement).all()
            print(f"DEBUG: Found {len(results)} posts in DB")

            # EXPLICIT LOG: What are these posts?
            for r in results:
                print(f"DEBUG: Post ID {r.id}, Type {r.type}, Title {r.title}")

            posts_with_authors = []
            for post in results:
                try:
                    post_dict = post.model_dump()
                    post_dict["author_name"] = get_display_name(post.author)
                    post_dict["author_picture"] = post.author.picture if post.author else None
                    post_dict["profile_pic_url"] = post.author.profile_pic_url if post.author else None
                    post_dict["comment_count"] = len(post.comments) if post.comments else 0
                    
                    # Check if current user has applied
                    if current_user_id:
                        post_dict["has_applied"] = any(applicant.user_id == current_user_id for applicant in post.applicants)
                    else:
                        post_dict["has_applied"] = False
                    
                    # Alias for frontend consistency
                    post_dict["is_enrolled"] = post_dict["has_applied"]
                        
                    posts_with_authors.append(post_dict)
                except Exception as e:
                    print(f"DEBUG ERROR: Failed to process post ID {post.id}: {str(e)}")
            
            return posts_with_authors
    except Exception as e:
        import traceback
        print(f"DEBUG CRITICAL ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{post_id}")
async def delete_post(post_id: int, current_user: User = Depends(get_current_user)):
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
        
        # Broadcast deletion to all connected clients
        await manager.broadcast({"type": "delete_post", "post_id": post_id})
        
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
            comment_dict["profile_pic_url"] = author.profile_pic_url if author else None

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
async def create_comment(post_id: int, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
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
        comment_dict["profile_pic_url"] = current_user.profile_pic_url or None
        comment_dict["upvote_count"] = 0
        comment_dict["user_has_upvoted"] = False

        # Create Notification for post OWNER (if not the one commenting)
        if post.author_id != current_user.id:
            student_name = get_display_name(current_user)
            create_notification(session, post.author_id, "New Assist", f"{student_name} assisted on your post: {post.title}", "assist")
            session.commit()

        # Broadcast new comment to all connected clients
        await manager.broadcast({
            "type": "new_comment",
            "post_id": post_id,
            "comment": comment_dict
        })

        return comment_dict

@router.patch("/{post_id}/comments/{comment_id}")
async def update_comment(post_id: int, comment_id: int, comment_data: CommentUpdate, current_user: User = Depends(get_current_user)):
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
        
        # Broadcast edited comment to all connected clients
        await manager.broadcast({
            "type": "edit_comment",
            "post_id": post_id,
            "comment": comment_dict
        })
        
        return comment_dict

@router.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: int, comment_id: int, current_user: User = Depends(get_current_user)):
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
        
        # Broadcast deletion to all connected clients
        await manager.broadcast({
            "type": "delete_comment",
            "post_id": post_id,
            "comment_id": comment_id
        })
        
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
        
        # Create Notification for project OWNER — check for duplicates first
        # We only notify if they haven't been notified about this specific project/user combo before
        # Using type='project' and related_id=post.id
        existing_notif = session.exec(
            select(Notification).where(
                Notification.user_id == post.author_id,
                Notification.type == "project",
                Notification.related_id == post.id,
                Notification.message.contains(get_display_name(current_user))
            )
        ).first()

        if not existing_notif:
            student_name = get_display_name(current_user)
            create_notification(
                session, 
                post.author_id, 
                "New Enrollment", 
                f"{student_name} enrolled in your project: {post.title}", 
                "project",
                related_id=post.id
            )
        
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
                    "picture": user.picture,
                    "profile_pic_url": user.profile_pic_url
                })
                
        return applicant_data
