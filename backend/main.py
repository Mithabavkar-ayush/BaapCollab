from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query, Depends
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables at the very start
load_dotenv()

from routers import auth, posts, rewards, admin, notifications
from ws_manager import manager
# from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

app = FastAPI(title="BaapCollab API")

# The following line is a duplicate in the provided edit, keeping original structure
# from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/debug/raw-posts")
def debug_raw_posts():
    from sqlmodel import Session, select
    from database import Post, engine
    with Session(engine) as session:
        posts = session.exec(select(Post)).all()
        return [p.model_dump() for p in posts]

@app.on_event("startup")
def on_startup():
    print("🚀 [STARTUP] Initializing Database Schema...")
    try:
        from database import create_db_and_tables
        create_db_and_tables()
        print("✅ [STARTUP] Database initialized successfully.")
    except Exception as e:
        print(f"❌ [STARTUP] FATAL ERROR during database initialization: {e}")
        import traceback
        traceback.print_exc()
        # Do not raise here, allow app to start so we can see logs/errors via API if needed
    pass

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(rewards.router, prefix="/rewards", tags=["rewards"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Google OAuth Config
@app.get("/debug/db-status")
def debug_db_status():
    from sqlmodel import Session, select, func
    from database import User, Post, RewardLog, engine
    try:
        with Session(engine) as session:
            u_count = session.exec(select(func.count()).select_from(User)).one()
            p_count = session.exec(select(func.count()).select_from(Post)).one()
            r_count = session.exec(select(func.count()).select_from(RewardLog)).one()
            return {
                "status": "online",
                "counts": {
                    "users": u_count,
                    "posts": p_count,
                    "reward_logs": r_count
                },
                "db_type": "postgresql" if "postgresql" in str(engine.url) else "sqlite"
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket, user_id: Optional[int] = Query(default=None)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep the connection alive; wait for client messages (ping/pong)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)

@app.websocket("/ws/chat/general")
async def websocket_chat_general(websocket: WebSocket, user_id: Optional[int] = Query(default=None)):
    await manager.connect(websocket, user_id, room="general")
    try:
        from database import ChatMessage, User, engine
        from sqlmodel import Session, select
        
        with Session(engine) as session:
            stmt = (
                select(ChatMessage, User)
                .join(User, ChatMessage.user_id == User.id)
                .where(ChatMessage.room == "general")
                .order_by(ChatMessage.created_at.desc())
                .limit(50)
            )
            results = session.exec(stmt).all()
            
            history_messages = []
            for msg, u in reversed(results):
                history_messages.append({
                    "id": msg.id,
                    "user_id": msg.user_id,
                    "full_name": u.name,
                    "avatar_url": u.profile_pic_url or u.picture,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                })
            
            await websocket.send_json({
                "type": "message_history",
                "messages": history_messages
            })

        while True:
            data = await websocket.receive_text()
            if not data or not data.strip():
                continue
                
            if data.strip().lower() == "ping":
                continue
                
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            
            with Session(engine) as session:
                if user_id is None:
                    continue
                    
                recent_stmt = (
                    select(ChatMessage)
                    .where(ChatMessage.user_id == user_id)
                    .where(ChatMessage.room == "general")
                    .order_by(ChatMessage.created_at.desc())
                )
                last_msg = session.exec(recent_stmt).first()
                if last_msg:
                    diff = (now - last_msg.created_at).total_seconds()
                    if diff < 300:
                        await websocket.send_json({
                            "type": "slowmode_error",
                            "retry_after": int(300 - diff)
                        })
                        continue
                        
                new_msg = ChatMessage(user_id=user_id, room="general", content=data.strip())
                session.add(new_msg)
                session.commit()
                session.refresh(new_msg)
                
                user = session.get(User, user_id)
                
                await manager.broadcast({
                    "type": "new_message",
                    "id": new_msg.id,
                    "user_id": new_msg.user_id,
                    "full_name": user.name if user else "Unknown",
                    "avatar_url": user.profile_pic_url or user.picture if user else None,
                    "content": new_msg.content,
                    "created_at": new_msg.created_at.isoformat()
                }, room="general")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, room="general")
    except Exception as e:
        print(f"Chat WS error: {e}")
        manager.disconnect(websocket, user_id, room="general")

@app.get("/chat/general/history")
def get_chat_history(before_id: Optional[int] = None, current_user=Depends(auth.get_current_user_no_exception if hasattr(auth, 'get_current_user_no_exception') else (lambda: None))):
    from auth_utils import get_current_user
    from database import ChatMessage, User, engine
    from sqlmodel import Session, select
    
    with Session(engine) as session:
        stmt = select(ChatMessage, User).join(User, ChatMessage.user_id == User.id).where(ChatMessage.room == "general")
        if before_id:
            stmt = stmt.where(ChatMessage.id < before_id)
        stmt = stmt.order_by(ChatMessage.created_at.desc()).limit(50)
        
        results = session.exec(stmt).all()
        history_messages = []
        for msg, u in reversed(results):
            history_messages.append({
                "id": msg.id,
                "user_id": msg.user_id,
                "full_name": u.name,
                "avatar_url": u.profile_pic_url or u.picture,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            })
        return history_messages

@app.get("/")
def read_root():
    return {"message": "Welcome to BaapCollab API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
