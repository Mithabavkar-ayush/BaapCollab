import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables
from dotenv import load_dotenv
import os

# Load environment variables at the very start
load_dotenv()

from routers import auth, posts, rewards

app = FastAPI(title="BaapCollab API")

# DISABLE strict slashes to prevent 307 redirects that downgrade to HTTP
app.router.redirect_slashes = False

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"\n--- REQUEST: {request.method} {request.url.path} ---")
    print(f"Origin: {request.headers.get('origin')}")
    print(f"Auth: {request.headers.get('authorization')[:20] if request.headers.get('authorization') else 'None'}...")
    try:
        response = await call_next(request)
        print(f"Response: {response.status_code}")
        return response
    except Exception as e:
        print(f"REQUEST ERROR: {e}")
        raise e

frontend_url = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "https://baapcollab.vercel.app",
    "https://baapcollab-frontend.vercel.app",
    "https://baapcollab-backend-production.up.railway.app",
]

# Add any dynamic Vercel preview URLs
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://baapcollab\.vercel\.app.*|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    pass

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(rewards.router, prefix="/rewards", tags=["rewards"])

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

@app.get("/")
def read_root():
    return {"message": "Welcome to BaapCollab API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
