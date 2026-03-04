# 🚀 BaapCollab — v3.0

BaapCollab is a premium, institute-grade collaboration platform built for students and institutions in the Baap Company ecosystem. It features secure Google OAuth authentication, a dynamic project discovery board with enrollment, community-driven forum discussions with moderation tools, a live contribution leaderboard, and deep profile integration across every surface.

---

## 🌟 What's New in V3.0

| Feature | Description |
|---------|-------------|
| 🎯 **Project Enrollment** | Users can **Enroll** or **Unenroll** from projects with instant optimistic UI updates and no page reloads |
| 👥 **Applicant Management** | Project owners can click **"Check Applicants"** to open a modal listing all enrolled users with profile links |
| 🗑️ **Project Deletion** | Owners can delete their projects via a confirmation modal; cascades safely through all applicant records |
| 🛡️ **Forum Moderation** | Assist (comment) authors and project owners can delete forum messages |
| ↩️ **5-Second Undo** | Assist deletions are instant with a snackbar giving a **5-second Undo** window before permanent deletion |
| 🔗 **Universal Profile Linking** | Every avatar and username across Projects, Forum, and Leaderboard now links to the user's profile page |
| 👤 **Profile View Navigation** | "Inspect Profile" pages have the same nav capsule (Dashboard, Projects, Forum) as the main app |

---

## 🌟 Core Features

- **🔐 Secure Google OAuth**: Integrated authentication with Google for a one-click login experience.
- **📋 Smart Onboarding**: 3-step guided flow — Login → Branch Verification → Profile Completion.
- **📊 Dynamic Dashboard**: Tabbed view for **Projects**, **Forum**, and **Leaderboard**, with deep-link URL parameters (`?tab=projects`).
- **🏆 Leaderboard**: Live contribution point ranking with staggered entrance animations. Top 10 members displayed with profile links.
- **💬 Forum & Assist System**: Post topics, write assists (replies), edit or delete them. Upvote other users' assists to reward contribution points.
- **🧮 Contribution Points**: Upvoting an assist rewards the author +5 points. Points are tracked on the leaderboard.
- **🎨 Premium UI**: Glassmorphism aesthetic, smooth transitions, hover micro-animations, and responsive layouts throughout.

---

## 🏗️ Project Structure

```bash
├── backend/                    # FastAPI (Python) backend
│   ├── main.py                 # Entry point & CORS config
│   ├── database.py             # SQLModel schema (User, Post, Comment, ProjectApplicant, ...)
│   ├── auth_utils.py           # JWT & Google OAuth helpers
│   └── routers/
│       ├── auth.py             # /auth/* — Google login, JWT
│       ├── posts.py            # /posts/* — CRUD, apply, applicants, comments, upvotes
│       ├── users.py            # /users/* — profile, leaderboard
│       └── rewards.py          # /rewards/* — contribution logs
├── frontend/                   # Next.js (React) frontend
│   ├── src/app/
│   │   ├── page.tsx            # Dashboard (Projects, Forum, Leaderboard tabs)
│   │   ├── leaderboard/        # Leaderboard page
│   │   └── profile/[id]/       # Dynamic user profile pages
│   └── src/components/
│       └── dashboard/
│           ├── ProjectList.tsx # Project cards with Enroll/Unenroll, Check Applicants, Delete
│           └── ForumList.tsx   # Forum cards with assist system, moderation, undo delete
└── .gitignore
```

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google OAuth Client ID & Secret

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install fastapi uvicorn sqlmodel google-auth python-dotenv python-jose passlib
uvicorn main:app --reload --port 8000
```

Create a `backend/.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_super_secret_key
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the app at **http://localhost:3000**

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/google` | Google OAuth login |
| `GET` | `/posts` | Get all projects (with `has_applied` status) |
| `POST` | `/posts/{id}/apply` | Enroll in a project |
| `DELETE` | `/posts/{id}/apply` | Unenroll from a project |
| `GET` | `/posts/{id}/applicants` | Owner-only: list all applicants |
| `DELETE` | `/posts/{id}` | Owner-only: delete project (cascades) |
| `POST` | `/posts/{id}/comments` | Post an assist |
| `DELETE` | `/posts/{id}/comments/{cid}` | Author/Owner-only: delete an assist |
| `POST` | `/posts/{id}/comments/{cid}/upvote` | Toggle upvote on an assist |
| `GET` | `/users/leaderboard` | Top 10 users by contribution points |
| `GET` | `/users/{id}/public` | Public profile for any user |

---

## 🛡️ Security

- All write/delete actions require a valid **JWT Bearer token** in the `Authorization` header.
- Authorization checks are enforced at the API level for sensitive operations (delete post, view applicants, delete assist).
- The `.gitignore` shields all `.env` files from version control.

---

Built with ❤️ by the BaapCollab Team.
