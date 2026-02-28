# MTS Spacehack Backend: Deep Dive Architecture

This document provides an exhaustive technical breakdown of the backend infrastructure, logic, and security patterns.

---

## 1. Entry Point & Global Configuration (`/src/main.ts`)

The application lifecycle begins here. Key responsibilities:

- **Environment Management:** Dynamically loads `.env.prod` or `.env.dev` (uses `127.0.0.1` for local DB to avoid IPv6 issues).
- **Cookie Parsing:** Uses `cookie-parser` middleware to support secure `HttpOnly` tokens.
- **Global Validation:** Implements `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- **CORS Configuration:** Strictly defined to allow mobile/web clients.
- **Swagger Integration:** OpenAPI 3.0 suite at `/swagger`.

---

## 2. Modular Architecture (NestJS Core)

- **`AppModule` (`src/modules/app.module.ts`)**: The root container.
- **`DatabaseModule` (`src/modules/database.module.ts`)**: TypeORM connection.
- **`AuthModule` (`src/modules/auth.module.ts`)**: Now explicitly imports `TypeOrmModule.forFeature([Session])`.
- **`UsersModule` (`src/modules/users.module.ts`)**: Handles user identity.

---

## 3. The Five-Layer Logic Flow (Refactored)

### 3.1. Entity Layer (`src/models/`)

- **`User` Entity**: Includes a fix for the "Double Hashing" bug.
  - **Before:** Hashed password on every update, even if unchanged.
  - **After:** Uses `@AfterLoad` to store the original hash and `@BeforeUpdate` to compare. Hashing only occurs if the password actually changed.
- **`Session` Entity**: Stores `refresh_token`.

### 3.2. Repository Layer (`src/repositories/`)

- **Pattern Shift**:
  - **Before:** Custom repositories extended `Repository<T>` and were manually instantiated in constructors.
  - **After:** Follows the official NestJS pattern. Repositories are `@Injectable()` classes that inject a private `repository: Repository<T>` via `@InjectRepository()`. This improves testability and follows framework standards.

### 3.3. Service Layer (`src/auth/`, `src/services/`)

- **`AuthService`**: Moved from `src/services/` to `src/auth/` for better domain isolation.
  - **New Feature: Transactions.** `changePassword` now uses `this.dataSource.transaction` to ensure password updates and session invalidations happen atomically.
  - **New Feature: Security.** Invalidates all sessions on password change.
- **`UsersService`**:
  - **Fix:** `create` method corrected to check for existing users by `username` (previously had a field mismatch bug).

### 3.4. Controller Layer

- **`AuthController` (`src/auth/auth.controller.ts`)**:
  - **Before:** All tokens passed via `Authorization` headers.
  - **After:** `refresh_token` is handled via `HttpOnly` cookies. Added `logout`, `logout_all`, and `change_password` endpoints.
- **`UsersController`**: Personal profile management with `JwtGuard`.

---

## 4. Security & Authentication Deep Dive

### 4.1. Token Strategy (Refactored)

- **Access Token:** JWT, 15m lifetime, `Authorization: Bearer` header.
- **Refresh Token:**
  - **Before:** Sent in headers. Visible to client-side JS.
  - **After:** Sent in `HttpOnly` cookie (`refresh_token`). **Invisible to client-side JavaScript**, providing strong protection against XSS.

### 4.2. Password Update Flow

- **Before:** Status `401` on duplicate password.
- **After:** Status `400 BadRequestException` with message `PASSWORDS_IS_DUPLICATE`.

---

## 5. Deployment & DevOps Infrastructure

- **Dockerization:**
  - `Dockerfile`: Multi-stage build (uses `node:22-slim`).
  - `docker-compose.dev.yml`: Added for local development with port `5050`.

---

## 6. Mobile Developer Quick Start

- **Base URL:** `http://localhost:5050/api` (Dev) / `https://kurumi.software/api` (Prod)
- **Authentication Flow:**
  1. `POST /auth/login` sets a `refresh_token` cookie.
  2. Use `accessToken` from response body in `Authorization: Bearer`.
  3. For `401`, call `POST /auth/refresh`. **Note:** No need to send the refresh token manually; the browser/client should send the cookie automatically.
