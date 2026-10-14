# IntervAI — AI-Powered Interview Preparation

IntervAI is a full-stack web application designed to help users prepare for interviews through an interactive web interface and AI-powered assistance.

## Technology Stack

- **Frontend:** React, Vite, JavaScript/TypeScript
- **Backend:** NestJS, Node.js, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI Integration:** Google Gemini API
- **Authentication:** JWT and bcrypt dependencies
- **Containerization:** Docker and Docker Compose

## Project Architecture

- **Frontend:** Provides the user interface and communicates with the backend API.
- **Backend:** Handles application requests, business logic, and AI integration.
- **PostgreSQL:** Stores application data.
- **Prisma:** Provides database access through the configured schema and client.
- **Gemini API:** Supports AI functionality using a server-side API key.
- **Docker Compose:** Starts the PostgreSQL database and backend service for local development.

## Project Structure

```text
IntervAI/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
├── README.md
└── .gitignore
```

The Dockerfile and Compose file locations may differ in the actual repository.

## Prerequisites

- Node.js and npm
- Docker Desktop with Docker Compose
- A Google Gemini API key
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/arunchaudhary-cs/IntervAI.git
cd IntervAI
```

### 2. Configure environment variables

Create a `.env` file in the directory from which Docker Compose reads its configuration.

Configure the required variables:

```env
JWT_SECRET=replace_with_a_secure_random_secret
GEMINI_API_KEY=your_gemini_api_key
```

The backend also requires a valid database connection. The local Docker Compose configuration supplies `DATABASE_URL` to the backend service.

Never commit real credentials or `.env` files to GitHub.

### 3. Start the backend and database

Navigate to the directory containing the Docker Compose file, then run:

```bash
docker compose up --build -d
```

This starts the PostgreSQL and backend services defined in the Compose configuration.

To inspect service status:

```bash
docker compose ps
```

To view backend logs:

```bash
docker compose logs -f backend
```

To stop the services:

```bash
docker compose down
```

### 4. Start the frontend

Open a separate terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

Ensure the frontend API configuration points to the running backend. The local backend port in the provided Docker configuration is `3000`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used for JWT-related functionality |
| `GEMINI_API_KEY` | Server-side Gemini API authentication |

Use the exact variable names required by the application.

## Deployment

The frontend and backend can be deployed separately.

A production deployment requires:

- A hosted frontend
- A publicly reachable backend API
- A production PostgreSQL database
- Correct production environment variables
- Appropriate CORS configuration
- A frontend API URL pointing to the deployed backend
- Working database migrations and AI integration

Local Docker networking and database credentials must not be reused blindly in production.

## Security

- Keep API keys and passwords out of source control.
- Use secure production environment variables.
- Use a strong JWT secret.
- Configure database access appropriately.
- Validate API inputs and handle errors safely.

## Author

**Arun Chaudhary**

GitHub: https://github.com/arunchaudhary-cs
