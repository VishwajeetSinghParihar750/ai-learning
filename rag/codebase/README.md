# Production-Ready Node.js REST API

This is a production-ready REST API built with Node.js, Express, Sequelize ORM, PostgreSQL (with SQLite fallback), Jest, Supertest, and Docker.

It implements best practices for security, robust error handling, database-backed authentication, environment configuration, integration testing, and containerization.

---

## Features

- **Standard REST Architecture**: Clean Separation of Concerns (Routes -> Middlewares -> Controllers -> Models).
- **Authentication**: JWT (JSON Web Tokens) based secure auth, with bcrypt password hashing and token expiration.
- **Relational DB / ORM**: Sequelize ORM supporting dynamic database configuration (PostgreSQL in production/Docker, fast in-memory SQLite for testing, local SQLite file for development).
- **Security Best Practices**:
  - `helmet` to set secure HTTP headers.
  - `cors` to handle Cross-Origin Resource Sharing.
  - Body payload size limiting (`10kb`) to prevent DOS attacks.
  - Robust database validations and query protections.
  - Run as non-privileged `node` user in production Docker container.
- **Request Validation**: Schema-based request validations using `Joi` middleware.
- **Global Error Handling**: Custom `AppError` class separating operational and programming errors. Error messages are customized for Dev/Prod environments.
- **System Integrity & Logs**: Standard logging using `morgan` (suppressed during testing) and structured JSON error/success payloads.
- **Healthcheck Endpoint**: Fully integrated `/health` API verifying both app uptime and real-time database connectivity status.
- **Advanced Automated Testing**: 17 integration tests covering registration, login, profile authentication, and full CRUD task isolation.
- **Docker Multi-Stage Build**: Highly optimized multi-stage build separate for base, dependencies, tests, and production targets.

---

## Directory Structure

```text
├── Dockerfile                  # Multi-stage Docker image definition
├── README.md                   # Setup and deployment instructions
├── database.sqlite             # Local dev database file (generated automatically)
├── docker-compose.test.yml     # Isolated Docker testing setup
├── docker-compose.yml          # Production/Dev docker orchestration setup
├── package-lock.json
├── package.json
├── src
│   ├── app.js                  # Express App configuration and middlewares
│   ├── server.js               # Main entry point and process signal handlers
│   ├── config
│   │   └── db.js               # Database connection and dynamic dialect setup
│   ├── controllers
│   │   ├── authController.js   # User registration, login, profile retrieval
│   │   └── taskController.js   # Tasks CRUD controllers with pagination and filters
│   ├── middlewares
│   │   ├── auth.js             # Authentication route protection middleware
│   │   ├── errorHandler.js     # Centralized operational & system error handler
│   │   └── validate.js         # Joi schema validator middleware
│   ├── models
│   │   ├── Task.js             # Task model schema and relationships
│   │   ├── User.js             # User model schema, hook hashing, compare method
│   │   └── index.js            # Unified model loading/exporting
│   ├── routes
│   │   ├── authRoutes.js       # Authentication endpoints routing
│   │   └── taskRoutes.js       # Task CRUD endpoints routing
│   └── utils
│       ├── appError.js         # Custom AppError utility
│       ├── catchAsync.js       # Wrapper to eliminate redundant try-catch blocks
│       ├── token.js            # JWT signing utility
│       └── validationSchemas.js# Reusable Joi validation schemas
└── tests
    ├── integration
    │   ├── auth.test.js        # Auth authentication integration tests
    │   └── task.test.js        # Tasks CRUD and ownership validation tests
    └── setup.js                # Global Jest database setup & teardown
```

---

## Tech Stack

- **Runtime Environment**: Node.js (v20/v22)
- **Framework**: Express.js
- **Database ORM**: Sequelize ORM
- **Supported Dialects**: PostgreSQL, SQLite (for instant local usage)
- **Testing Tools**: Jest & Supertest
- **Containerization**: Docker & Docker Compose

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (optional, for containerization)

### Local Development Setup

1. **Clone or navigate to the directory**:
   ```bash
   cd ~/testing
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *Note: By default, the app is pre-configured to automatically fall back to local SQLite if no database credentials are provided in `.env`. This means it runs out of the box with zero database configuration!*

4. **Start the server in Development mode**:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`.

---

## API Endpoints

### 1. Healthcheck

- **GET `/health`**
  - Public endpoint. Verifies uptime and real-time database state.
  - Response:
    ```json
    {
      "status": "success",
      "timestamp": "2026-06-13T20:15:32.123Z",
      "uptime": 12.34,
      "services": {
        "database": "UP"
      }
    }
    ```

### 2. Authentication

- **POST `/api/v1/auth/register`**
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
  - Returns `201 Created` with a JWT `token`.

- **POST `/api/v1/auth/login`**
  - Body: `{ "email": "john@example.com", "password": "password123" }`
  - Returns `200 OK` with a JWT `token`.

- **GET `/api/v1/auth/me`**
  - Headers: `Authorization: Bearer <your_jwt_token>`
  - Returns `200 OK` with the authenticated user profile.

### 3. Tasks (Protected CRUD)
*All routes require an `Authorization: Bearer <token>` header.*

- **GET `/api/v1/tasks`**
  - Retrieves all tasks owned by the authenticated user.
  - Query parameters (optional):
    - `completed` (`true` or `false`) to filter.
    - `page` (default `1`) and `limit` (default `10`) for pagination.
  - Response:
    ```json
    {
      "status": "success",
      "results": 2,
      "total": 2,
      "page": 1,
      "totalPages": 1,
      "data": { "tasks": [...] }
    }
    ```

- **POST `/api/v1/tasks`**
  - Body: `{ "title": "Finish Report", "description": "Q3 metrics details", "completed": false }`
  - Returns `201 Created` with the newly created task.

- **GET `/api/v1/tasks/:id`**
  - Retrieves a specific task. Returns `404 Not Found` if the task does not belong to the user.

- **PUT `/api/v1/tasks/:id`**
  - Body: `{ "title": "Updated Title", "completed": true }` (at least one field is required).
  - Updates and returns the updated task.

- **DELETE `/api/v1/tasks/:id`**
  - Deletes the task. Returns `204 No Content`.

---

## Running Tests

Integration tests run in an isolated in-memory database context.

Run tests locally:
```bash
npm run test
```

---

## Running with Docker

### 1. Build & Run Application with Production DB (PostgreSQL)

Build and spin up the complete API and its associated PostgreSQL database with robust healthcheck synchronization:
```bash
docker compose up --build
```
This will:
- Spin up a PostgreSQL database instance container.
- Run health checks to verify PostgreSQL readiness.
- Spin up the Node.js production service container, executing database synchronization and launching on port `3000`.

To teardown containers:
```bash
docker compose down
```

### 2. Run Containerized Integration Tests (CI/CD Mode)

Execute containerized test runs against an isolated PostgreSQL instance matching production environments:
```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from api-test
```
This launches both test database and API containers, runs the complete test suite inside the test image context, propagates the exact exit status, and cleans up.

---

## Deployment Instructions

### 1. Preparing the Application for Production

1. **Verify Environment Variables**:
   In production, always ensure:
   - `NODE_ENV=production`
   - `JWT_SECRET` is set to a long, cryptographic, secure secret key.
   - `DATABASE_URL` is configured to point to a production-grade database service (e.g., AWS RDS, GCP Cloud SQL, or Hosted Postgres on Supabase/Neon).
   
2. **Security & Performance**:
   - The production container is pre-configured to run as a non-privileged user `node`.
   - Security headers are enforced automatically via `helmet`.
   - Cors rules should be updated in `src/app.js` with your production frontend domain.

### 2. Deploying on Heroku / Render / Railway

1. **Setup on Render or Railway**:
   - Create a new Web Service.
   - Link your Git repository.
   - Set the build command: `npm install`
   - Set the start command: `npm start`
   - Configure your environment variables in the provider dashboard (`PORT`, `DATABASE_URL`, `JWT_SECRET`).
   - Enable `SSL Connection` in your database settings (our Database connector is pre-configured to dynamically support `rejectUnauthorized: false` for production database providers).

### 3. Deploying to Cloud Providers (AWS / GCP / DigitalOcean) using Docker

For standard virtual private servers (VPS) or container orchestrators (AWS ECS, Google Cloud Run, Kubernetes):

1. **Build and push the Production Docker image**:
   ```bash
   docker build --target production -t yourusername/node-auth-api:latest .
   docker push yourusername/node-auth-api:latest
   ```

2. **Deploy on AWS ECS / Google Cloud Run**:
   - Reference `yourusername/node-auth-api:latest` in your task/service definitions.
   - Inject the environment variables `JWT_SECRET` and `DATABASE_URL` securely using secrets managers (like AWS Secrets Manager or GCP Secret Manager).
   - Expose container port `3000` to your Application Load Balancer (ALB) or gateway.
