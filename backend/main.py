from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables at the very start
load_dotenv()

from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from routers import auth, posts, rewards
from ws_manager import manager

app = FastAPI(title="BaapCollab API")

# Essential for Railway/Vercel proxying
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://baap-collab.vercel.app",
        "https://baapcollab.vercel.app",
        "https://baap-collab-frontend.vercel.app",
    ],
    allow_origin_regex=r"https://baap-collab.*\.vercel\.app",
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

import asyncio

@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket, token: Optional[str] = None):
    # Browser WebSockets don't support custom headers, so token must be in the URL query
    if token:
        print(f"🔌 [WS CONNECT] Authorized connection (Token provided)")
    else:
        print("🔌 [WS CONNECT] Anonymous connection (No token provided)")

    await manager.connect(websocket)
    
    # Active Heartbeat Task: Send a server-side ping every 20s to bypass Railway timeouts
    async def heartbeat():
        try:
            while True:
                await asyncio.sleep(20)
                if websocket.client_state.value == 1: # WebSocketState.CONNECTED
                    await websocket.send_text(json.dumps({"type": "ping", "timestamp": "server_to_client"}))
        except:
            pass

    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        while True:
            # wait for client messages (ping/pong)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"🔌 WebSocket Error: {e}")
        manager.disconnect(websocket)
    finally:
        heartbeat_task.cancel()

@app.get("/")
def read_root():
    return {"message": "Welcome to BaapCollab API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
