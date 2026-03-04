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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(rewards.router, prefix="/rewards", tags=["rewards"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BaapCollab API"}
