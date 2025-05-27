# Backend (NestJS)

This directory contains the NestJS backend application for the Full-Stack SaaS Template.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn
- PostgreSQL database (running locally, via Docker, or accessible remotely)
- Prisma CLI (`npm install -g prisma` or use via npx)

## Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Environment Variables:**
    Copy the example environment file and update it with your configuration:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` with your actual database URL, JWT secrets, Postal SMTP credentials, and frontend URL.

3.  **Database Setup (Prisma):**
    - Ensure your PostgreSQL server is running and accessible.
    - Update the `DATABASE_URL` in your `.env` file.
    - Run Prisma migrations to create the database schema:
      ```bash
      npx prisma migrate dev --name init
      ```
    - Generate Prisma Client:
      ```bash
      npx prisma generate
      ```
      _(This is also included in the `start:dev` script and build process, but good to run initially.)_

## Running the Application

- **Development Mode (with hot-reloading):**

  ```bash
  npm run start:dev
  # or
  yarn start:dev
  ```

  This will start the NestJS application, typically on `http://localhost:3000` (configurable).

- **Production Mode:**
  First, build the application:
  ```bash
  npm run build
  # or
  yarn build
  ```
  Then, start the production server:
  ```bash
  npm run start:prod
  # or
  yarn start:prod
  ```

## Linting and Formatting

- **Lint:**
  ```bash
  npm run lint
  # or
  yarn lint
  ```
- **Format:**
  ```bash
  npm run format
  # or
  yarn format
  ```

## Testing

- **Run all unit tests:**
  ```bash
  npm test
  # or
  yarn test
  ```
- **Run tests in watch mode:**
  ```bash
  npm run test:watch
  # or
  yarn test:watch
  ```

## Prisma Studio (Optional)

To view and manage your database data via a web interface:

```bash
npx prisma studio
```

## Project Structure

- `src/`: Main application code.
  - `auth/`: Authentication module (signup, login, magic links, JWT, guards).
  - `user/`: User management module.
  - `waitlist/`: Waitlist management module.
  - `prisma/`: Prisma service and configuration.
  - `email/`: Email sending service (for magic links).
  - `common/`: Shared utilities, DTOs, decorators.
  - `main.ts`: Application entry point.
  - `app.module.ts`: Root application module.
- `prisma/`: Prisma schema and migrations.
  - `schema.prisma`: Defines database models.
  - `migrations/`: Database migration history.
- `test/`: Jest unit and e2e tests.
- `.env.example`: Example environment variables.
- `.eslintrc.js`: ESLint configuration.
- `.prettierrc`: Prettier configuration.
- `nest-cli.json`: NestJS CLI configuration.
- `tsconfig.json`: TypeScript configuration.
- `tsconfig.build.json`: TypeScript build configuration.
