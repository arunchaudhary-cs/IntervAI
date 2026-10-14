<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# IntervAI — AI-Powered Interview Preparation

IntervAI is a full-stack web application designed to help users prepare for technical interviews using AI-powered assistance.

## Overview

IntervAI combines a modern web frontend with a backend API, AI integration, and database access to provide an interactive interview preparation experience.

## Technology Stack

- **Frontend:** React, Vite, TypeScript (if used in the current implementation)
- **Backend:** NestJS, Node.js, TypeScript
- **AI Integration:** Google Gemini API using Google GenAI
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Development Environment:** Docker, where required

## Features

List the features implemented in the current version, such as:

- Interactive interview preparation interface
- AI-assisted interview question generation
- AI-generated responses or feedback
- Backend API for application functionality
- Database integration using Prisma and PostgreSQL

Only retain features that you have tested successfully.

## Project Structure

```text
IntervAI/
├── frontend/       # React frontend
├── backend/        # NestJS API
├── README.md
└── .gitignore
```

Additional Docker and Prisma configuration files are maintained wherever required by the project.

## Prerequisites

- Node.js and npm
- Docker Desktop and Docker Compose, if required by the configured services
- A PostgreSQL database
- A Google Gemini API key

## Environment Configuration

Configure the environment variables required by the frontend and backend.

Typical backend configuration may include:

```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

Use the exact variable names and port expected by the application. Keep real credentials in local environment files or your hosting provider's environment settings. Never commit secrets to GitHub.

## Running the Project

1. Clone the repository.
2. Install dependencies in the frontend and backend directories.
3. Configure the required environment variables.
4. Start any required database or supporting services using the project's Docker configuration.
5. Run the backend and frontend using their respective package scripts.
6. Open the local frontend URL shown by the development server.

Consult the actual Docker Compose configuration and package scripts for the exact startup commands.

## Deployment

The frontend and backend can be deployed as separate services, provided the production configuration supports the required database and AI integrations.

Production setup must include the correct API URL, database connection, environment variables, and CORS configuration.

## Security

- Do not commit `.env` files or API keys.
- Validate inputs received by backend endpoints.
- Configure CORS for the intended frontend origin.
- Use secure environment-variable management in production.

## Author

Arun Chaudhary

GitHub: https://github.com/arunchaudhary-cs

