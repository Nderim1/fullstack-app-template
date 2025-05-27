# Full-Stack SaaS Application Template

This repository contains a full-stack web application template designed for SaaS applications. It includes three main parts:

- **Backend (NestJS)**: Handles API requests, business logic, database interactions, and authentication.
- **Frontend Application (Vite + React)**: The main user-facing application, including dashboards and authenticated user experiences.
- **Landing Page (Astro)**: A static marketing/landing page with a waitlist signup form.

## Project Structure

- `/backend`: NestJS application.
- `/frontend-app`: Vite + React application.
- `/landing-page`: Astro application.

Each sub-project has its own `README.md` with specific setup and run instructions.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn
- Docker (for PostgreSQL, or a separately installed instance)

## Getting Started

1. Clone this repository.
2. Navigate to each sub-project directory (`backend`, `frontend-app`, `landing-page`) and follow the instructions in their respective `README.md` files to install dependencies and run the applications.

## Core Technologies

**Backend:**
- Language: TypeScript
- Framework: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT, Magic Links, RBAC

**Frontend Application:**
- Bundler: Vite
- Framework: React
- Language: TypeScript
- State Management: Jotai
- Styling: TailwindCSS, MantineUI
- Data Fetching: Tanstack Query (React Query)
- Routing: Tanstack Router (React Router)

**Landing Page:**
- Framework: Astro
- Styling: TailwindCSS

## Environment Variables

Each sub-project uses `.env` files for configuration. You'll find `.env.example` files in each project directory. Copy these to `.env` and fill in the required values.

Key shared variables (ensure consistency where needed, e.g., API URLs):
- `DATABASE_URL` (Backend)
- `JWT_SECRET`, `JWT_EXPIRES_IN` (Backend)
- `POSTAL_SMTP_HOST`, `POSTAL_SMTP_PORT`, `POSTAL_SMTP_USER`, `POSTAL_SMTP_PASS` (Backend for magic links)
- `FRONTEND_URL` (Backend, used for constructing magic link URLs)
- `VITE_API_URL` (Frontend App, points to Backend API)
- `PUBLIC_API_URL` (Landing Page, points to Backend API for waitlist)

## Linting and Formatting

ESLint and Prettier are set up for all TypeScript/JavaScript projects. Use the following commands within each sub-project directory:

- `npm run lint` or `yarn lint`
- `npm run format` or `yarn format`

## Testing

Unit tests are set up for the backend (Jest) and frontend-app (Vitest).

- `npm test` or `yarn test` (within `backend` or `frontend-app`)
