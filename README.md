# 🚀 BaapCollab

BaapCollab is a premium collaboration platform designed for students and institutions within the Baap Company ecosystem. It features a seamless 3-step onboarding process, secure Google OAuth authentication, and a dynamic dashboard for projects and community discussions.

## 🌟 Key Features

- **Secure Google OAuth**: Integrated authentication with Google for a smooth login experience.
- **Smart Onboarding**: A 3-step guided flow:
  1. **Login**: Initial authentication.
  2. **Branch Verification**: Strict keyword-based institution matching to ensure association.
  3. **Profile Completion**: Personal and academic data capture (Name, Dept, Skills, Bio).
- **Comprehensive Profile System**: Full profile synchronization that globally replaces generic handles with actual user names across the platform.
- **Dynamic Dashboard**: Personalized view with interactive tabs for Projects, Forum, and Leaderboards.
- **Helper of the Week**: A point-based contribution system that dynamically highlights top community contributors by their synchronized platform profiles.
- **Premium UI**: Modern, glassmorphism-inspired design with smooth transitions, dynamic staggered loading animations, and micro-animations.

## 🏗️ Project Structure

```bash
├── backend/            # FastAPI (Python) backend
│   ├── main.py         # Entry point
│   ├── routers/        # API route handlers
│   └── database.py     # SQLModel configuration
├── frontend/           # Next.js (React) frontend
│   ├── src/app/        # App router and pages
│   └── src/data/       # Centralized institution data
└── .gitignore          # Root-level security protection
```

## 🛠️ Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies and run the server:
   ```bash
   pip install fastapi uvicorn sqlmodel google-auth python-dotenv
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:3000`.

## 🛡️ Security Note
The project is protected by a root-level `.gitignore` that shields all sensitive environment files (`.env`) from being tracked or uploaded to the repository.

---
Built with ❤️ by the BaapCollab Team.
