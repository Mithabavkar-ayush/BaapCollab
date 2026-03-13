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

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Request: {request.method} {request.url}")
    print(f"Origin: {request.headers.get('origin')}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

frontend_url = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Production Vercel URLs - hardcoded for reliability
    "https://baapcollab-frontend.vercel.app",
    "https://baapcollab-frontend-ayushs-projects-1c3d55f9.vercel.app",
    "https://baapcollab.vercel.app",
]

if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

@app.get("/")
def read_root():
    return {"message": "Welcome to BaapCollab API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
