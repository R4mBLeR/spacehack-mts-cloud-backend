# MTS Spacehack Backend: Deep Dive Architecture

This document provides an exhaustive technical breakdown of the backend infrastructure, logic, and security patterns. It is designed to be highly detailed for both human developers and AI agents.

---

## 1. Entry Point & Global Configuration (`/src/main.ts`)

The application lifecycle begins here. Key responsibilities:

- **Environment Management:** Dynamically loads `.env.prod` or `.env.dev` based on `NODE_ENV`.
- **CORS Configuration:** Strictly defined to allow mobile/web clients. It permits standard methods (GET, POST, PUT, DELETE, PATCH) and exposes the `authorization` header.
- **Global Prefix:** All API routes are prefixed with `/api`.
- **Swagger Integration:** In non-production environments, a full OpenAPI 3.0 documentation suite is served at `/swagger`.
- **Port Binding:** Defaults to `5050` (Dev) or `8080` (Prod), or follows the `PORT` environment variable.

---

## 2. Modular Architecture (NestJS Core)

The project is strictly modular, ensuring high maintainability and testability.

- **`AppModule` (`src/modules/app.module.ts`)**: The root container that imports all feature modules.
- **`DatabaseModule` (`src/modules/database.module.ts`)**: Handles the TypeORM connection to PostgreSQL. It features `synchronize: true` in development for automatic schema updates.
- **`AuthModule` (`src/modules/auth.module.ts`)**: Manages the security perimeter, including JWT issuance, password hashing, and session persistence.
- **`UsersModule` (`src/modules/users.module.ts`)**: Handles user profiles, role assignments, and permission mapping.

---

## 3. The Five-Layer Logic Flow

The system follows a refined version of the **Layered Architecture** pattern:

### 3.1. Entity Layer (`src/models/`)

Defines the "Source of Truth" for the database.

- **`BaseEntityWithId`**: Abstract base class to ensure consistent Primary Key (`id`) naming.
- **`User` Entity**: Contains core identity data. Includes a `@BeforeInsert()` / `@BeforeUpdate()` hook to automatically hash passwords using `AuthUtils`.
- **`Role` & `Permission` Entities**: Implement **RBAC (Role-Based Access Control)**. Roles have a "many-to-many" relationship with Permissions and Users.
- **`Session` Entity**: Specifically stores `refresh_token` strings, linking one or more active devices to a single user.

### 3.2. Repository Layer (`src/repositories/`)

Encapsulates all database-specific operations.

- **`UserRepository`**: Extends TypeORM's `Repository`. Contains specialized methods like `findUserByEmailOrUsername`. No business logic is allowed here.
- **`SessionRepository`**: Manages the "Token Rotation" logic at the database level (saving, finding, and updating tokens).

### 3.3. Service Layer (`src/services/`)

The "Brain" of the application where business rules live.

- **`AuthService`**: Handles the heavy lifting of authentication.
  - **Login/Register:** Validates credentials and calls `generateNewTokens()`.
  - **Refresh Logic:** Implements **Refresh Token Rotation**, replacing old tokens with new ones upon use to prevent replay attacks.
- **`UsersService`**: Orchestrates user-related tasks, coordinating between the `UserRepository` and other modules.

### 3.4. Controller Layer (`src/controllers/`, `src/auth/`)

The HTTP Interceptor layer.

- **`AuthController`**: Exposes `/api/auth/register`, `/login`, and `/refresh`.
- **`UsersController`**: Exposes `/api/users`. Crucially protected by decorators like `@HasRoles(Roles.ADMIN)`.

### 3.5. DTO Layer (`src/dto/`, `src/auth/dto/`)

Data Transfer Objects ensure that incoming data is strictly validated before reaching the Controller.

- **`CreateUserDto`**: Uses `class-validator` to enforce email formats, password length (min 8 chars), and phone number patterns.

---

## 4. Security & Authentication Deep Dive

### 4.1. JWT Strategy

- **Access Token:**
  - **Type:** JWT (Signed with `JWT_SECRET`).
  - **Lifetime:** 15 minutes (Hardcoded for security).
  - **Payload:** `{ sub: userId, username: string, roles: string[] }`.
- **Refresh Token:**
  - **Type:** 64-character random hex string.
  - **Storage:** Persisted in PostgreSQL (`sessions` table).
  - **Lifetime:** Single-use (Rotation pattern).

### 4.2. Guards & Decorators

- **`RolesGuard` (`src/auth/guards/roles.guard.ts`)**: A custom NestJS Guard that intercepts every request to protected routes. It verifies the JWT signature and checks if the `roles` array in the payload matches the requirements.
- **`@HasRoles()` Decorator**: A custom metadata decorator used to tag routes with specific permission requirements (e.g., `admin`, `user`).

---

## 5. Deployment & DevOps Infrastructure

- **Dockerization:**
  - `Dockerfile`: Multi-stage build for a lean production image.
  - `docker-compose.yml`: Orchestrates the NestJS container and a PostgreSQL 15 container.
- **Environment Separation:**
  - `.env.dev`: Local development settings.
  - `.env.prod`: Production-ready settings with restricted access.

---

## 6. Request Lifecycle Diagram

1. **Client** sends `POST /api/users` with a JWT in the `Authorization` header.
2. **RolesGuard** catches the request, verifies the JWT signature against `JWT_SECRET`, and extracts roles.
3. **RolesGuard** checks if the user has the `admin` role required by the `@HasRoles(Roles.ADMIN)` decorator.
4. **UsersController** receives the validated request.
5. **UsersService** processes the logic.
6. **UserRepository** executes the SQL query through TypeORM.
7. **PostgreSQL** returns the data.
8. **Controller** sends a JSON response back to the **Client**.
