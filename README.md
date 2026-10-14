# IntervAI — AI-Powered Mock Interview Platform

IntervAI is an intelligent full-stack mock interview platform designed to help candidates prepare for technical job interviews. Powered by Google's Gemini AI, it dynamically generates role-specific interview questions, analyzes user responses, tracks assessment integrity, and produces comprehensive evaluation reports with actionable feedback.

---

## 🌟 Key Features

- **Dynamic AI Interview Generation**: Generates role-specific questions across Frontend, Backend, Fullstack, DevOps, and System Design with configurable difficulty levels (Junior, Mid, Senior).
- **Dual Assessment Modes**:
  - 🎙️ **Voice Mode**: Real-time interactive voice assessment using speech recognition and dynamic audio visualization.
  - ⌨️ **Text / Written Mode**: Timed technical assessment environment with structured answer editors.
- **AI Feedback & Performance Scoring**: Evaluates candidate answers on accuracy, depth, and communication, providing strengths, weaknesses, and model answers.
- **Proctoring & Integrity Tracking**: Detects and logs browser tab switches during interviews to assess candidate focus.
- **Secure Authentication & Account Recovery**: JWT access/refresh token authentication, email verification, and secure OTP-based password resets.
- **Interactive Swagger Documentation**: Comprehensive interactive REST API docs at `/api`.

---

## 🏗️ Architecture & Monorepo Structure

IntervAI contains both the Frontend and Backend components within this single unified repository:

```text
IntervAI/
├── frontend/                  # React 19 + Vite Single Page Application
│   ├── src/
│   │   ├── pages/             # Dashboard, Interview, Results, Auth, etc.
│   │   ├── services/          # Axios API client & interceptors
│   │   └── App.jsx            # Router and navigation
│   └── package.json
│
├── backend/                   # NestJS 11 REST API Application
│   ├── src/
│   │   ├── ai/                # Google Gemini GenAI integration
│   │   ├── auth/              # JWT auth, verification & password reset
│   │   ├── interviews/        # Interview session orchestration
│   │   ├── reports/           # AI report evaluation engine
│   │   └── main.ts            # Entrypoint & Swagger setup
│   ├── prisma/                # PostgreSQL schema & migrations
│   ├── Dockerfile             # Multi-stage production container
│   └── package.json
│
└── README.md
```

## Prerequisites

- Node.js 22 or a compatible current LTS release
- npm
- Docker Desktop (recommended for local PostgreSQL)
- A Gemini API key

## Run locally

### 1. Configure the backend

Open a terminal in `backend/` and create your local environment file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `GEMINI_API_KEY` to your own values. Do not commit the real `.env` file. The sample database URL is for a local PostgreSQL instance.

### 2. Start PostgreSQL

From the `backend/` directory:

```bash
docker compose up -d postgres
```

The Compose database is available locally on port 5432. Its development credentials are intended only for local use.

### 3. Install backend dependencies and prepare the database

From `backend/`:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

If the project’s current migration setup requires a development migration workflow on a fresh local database, use the Prisma workflow configured for this backend and verify the generated client before starting the API.

The API listens on `http://localhost:3000`; Swagger documentation is available at `http://localhost:3000/api`.

### 4. Start the frontend

Open a second terminal in `frontend/`:

```bash
npm ci
npm run dev
```

Vite prints the local frontend URL (normally `http://localhost:5173`). The frontend reads `VITE_API_URL`; if it is not set, it uses `http://localhost:3000`.

For a deployed frontend, set `VITE_API_URL` to the deployed backend URL before building the frontend. Vite variables are public in the browser bundle: never put database passwords, JWT secrets, or the Gemini API key in a `VITE_*` variable.

## Environment variables

Backend variables are documented in [backend/.env.example](backend/.env.example):

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — separate random secrets
- `GEMINI_API_KEY` — private server-side Gemini API key
- `FRONTEND_URL` / `CORS_ORIGINS` — allowed frontend origin(s)
- `PORT` — API port (defaults to 3000)

For Docker Compose, the backend reads the required secrets from the environment or the `backend/.env` file. The default PostgreSQL credentials in Compose are for local development only.

## Deployment notes

- Deploy the backend with its Dockerfile or a Node.js service and configure all required backend environment variables.
- Use a managed PostgreSQL database in production; do not use the Compose hostname `postgres` outside the Compose network.
- Set `CORS_ORIGINS` to the exact deployed frontend origin(s), comma-separated if needed.
- Set frontend `VITE_API_URL` to the backend's public base URL and rebuild the frontend.
- Apply committed Prisma migrations to the production database before routing traffic.
- Use unique production database credentials and strong random JWT secrets.

## API documentation

When the backend is running, visit `/api` on the API host to explore the Swagger documentation.

## Security

Never commit real `.env` files, access tokens, database credentials, or API keys. If a secret has ever been committed, remove it from the repository and rotate it; adding it to `.gitignore` does not erase previous Git history.
