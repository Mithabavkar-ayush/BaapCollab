# BaapCollab Community Platform

"A centralized hub for collaboration, peer-mentoring, and digital identity in The Baap Company network."

## 🚀 Key Features

- **RBAC (Role-Based Access Control)**: 3-tier permissions (Superadmin, Admin/Mentor, Student).
- **Security**: 
    - Secure Email/Password Auth.
    - 5-minute Reset Expiry (IST).
    - Duplicate Password Prevention.
- **Community Forum**: Categorized tagging (React, Python, FastAPI) with localized "Time-Ago" timestamps.
- **Identity Card**: Digital Member Cards with dynamic name scaling and verification badges.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React (JavaScript/Next.js)
- **Database**: PostgreSQL
- **Dev Tools**: SQLModel, Pydantic, Vite/Tailwind

## 💻 Local Setup

### 1. Backend Configuration
- Navigate to `/backend`.
- Create a `.env` file based on the PRD requirements:
    ```env
    DATABASE_URL=your_postgres_url
    SECRET_KEY=your_secret_key
    ```
- Run the server:
    ```bash
    uvicorn main:app --reload
    ```

### 2. Frontend Configuration
- Navigate to `/frontend`.
- Install dependencies:
    ```bash
    npm install
    ```
- Run the development server:
    ```bash
    npm run dev
    ```

---
*Built with Agentic Creation for The Baap Company.*
