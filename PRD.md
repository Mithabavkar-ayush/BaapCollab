# PRD: BaapCollab Community Platform (v1.0)

## 1. Executive Summary
BaapCollab is a centralized web application for knowledge exchange, project collaboration, and student identity management within The Baap Company network. It bridges the gap between learning and professional "Agentic Creation" using AI-driven tools.

## 2. User Roles & Permissions (RBAC)
- **Superadmin (Ayush)**: Total system control, database management, and role assignment.
- **Admin (Mentors)**: Ability to verify members, moderate the community forum, and resolve student doubts.
- **Student**: Access to the forum, project collaboration tools, and a digital identity card.

## 3. Core Features & Requirements

### A. Authentication & Security
- **Email Login**: Custom email/password system replacing Google OAuth.
- **Forgot Password**:
    - Validate that the account exists before sending the email.
    - **5-Minute Expiry**: Reset links must expire after 5 minutes (Sync to IST).
- **Duplicate Prevention**: Block users from reusing their current password.
- **Profile Photos**: Support legacy Google profile URLs or fallback to initials-based avatars.

### B. Community Forum
- **Tagging System**:
    - Roles: Student, Mentor, Admin.
    - Stack: Python, FastAPI, React, PostgreSQL, AI/ML.
- **Time Synchronization**: All posts must display relative time (e.g., "just now") based on IST (UTC+5:30) to prevent the "6-hour offset" bug.

### C. Digital Identity Card
- **Verification**: Active cards feature a Green Checkmark.
- **Layout**:
    - Dynamic font scaling for long names (e.g., "Ayush Sunil Mithabhavkar").
    - Centered footer for full email display without truncation.

## 4. Technical Stack
- **Frontend**: React.js, Tailwind CSS, Three.js (for 3D components).
- **Backend**: Python (FastAPI).
- **Database**: PostgreSQL (hosted on Railway/Neon).
- **Time Management**: `pytz` for IST conversion.

## 5. Deployment Constraints
- All `BASE_URL` logic must be dynamic to support seamless transition between localhost and production.
- CORS policies must explicitly allow the production domain to prevent login failures.
