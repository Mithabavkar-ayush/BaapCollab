from sqlmodel import Session, select, create_engine
from database import User, Post, Comment, RewardLog, CommentUpvote

# Create a quiet engine
sqlite_url = "sqlite:///baap_collab.db"
engine = create_engine(sqlite_url, echo=False)

def delete_user_data(user_id):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            print(f"User with ID {user_id} not found.")
            return

        print(f"Starting deletion for User: {user.name} ({user.email})")

        # 1. Get all post IDs by this user
        posts = session.exec(select(Post).where(Post.author_id == user_id)).all()
        post_ids = [p.id for p in posts]
        print(f"Found {len(post_ids)} posts.")

        # 2. Get all comment IDs by this user
        own_comments = session.exec(select(Comment).where(Comment.author_id == user_id)).all()
        own_comment_ids = [c.id for c in own_comments]
        print(f"Found {len(own_comment_ids)} comments authored by user.")

        # 3. Get all comment IDs belonging to this user's posts
        comments_on_posts = []
        if post_ids:
            comments_on_posts = session.exec(select(Comment).where(Comment.post_id.in_(post_ids))).all()
        comments_on_posts_ids = [c.id for c in comments_on_posts]
        print(f"Found {len(comments_on_posts_ids)} comments on user's posts.")

        all_affected_comment_ids = list(set(own_comment_ids + comments_on_posts_ids))

        # 4. Delete CommentUpvotes
        # - Upvotes GIVEN by the user
        # - Upvotes RECEIVED on comments that are being deleted
        upvotes_to_delete = session.exec(select(CommentUpvote).where(
            (CommentUpvote.voter_id == user_id) | 
            (CommentUpvote.comment_id.in_(all_affected_comment_ids))
        )).all() if all_affected_comment_ids or user_id else []
        
        # If no comments affected, still check for upvotes given by user
        if not all_affected_comment_ids:
            upvotes_to_delete = session.exec(select(CommentUpvote).where(CommentUpvote.voter_id == user_id)).all()

        print(f"Deleting {len(upvotes_to_delete)} upvotes.")
        for uv in upvotes_to_delete:
            session.delete(uv)

        # 5. Delete Comments
        print(f"Deleting {len(all_affected_comment_ids)} comments.")
        for c_id in all_affected_comment_ids:
            comment = session.get(Comment, c_id)
            if comment:
                session.delete(comment)

        # 6. Delete Posts
        print(f"Deleting {len(posts)} posts.")
        for p in posts:
            session.delete(p)

        # 7. Delete RewardLogs
        reward_logs = session.exec(select(RewardLog).where(RewardLog.user_id == user_id)).all()
        print(f"Deleting {len(reward_logs)} reward logs.")
        for rl in reward_logs:
            session.delete(rl)

        # 8. Finally, delete the User
        print(f"Deleting user account.")
        session.delete(user)

        session.commit()
        print("SUCCESS: All data associated with Viraj Parhad has been deleted.")

if __name__ == "__main__":
    # User ID 3 was identified as Viraj Parhad (virajparhad0014@gmail.com)
    delete_user_data(3)
