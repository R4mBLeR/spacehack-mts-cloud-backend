<p align="center">
  <a href="https://kurumi.software/swagger/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# MTS Spacehack: Cloud Backend

This is the backend for the MTS Spacehack project, built with [NestJS](https://nestjs.com/) and [PostgreSQL](https://www.postgresql.org/).

## 🚀 Quick Links

- **API Base URL:** `https://kurumi.software/api`
- **Swagger Documentation:** `https://kurumi.software/swagger/`
- **Architecture Overview:** [architecture.md](file:///home/kurumi/code/temp/MTCback/spacehack-mts-cloud-backend/architecture.md)

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL + TypeORM
- **Auth:** JWT (Access Token) + Session-based Refresh Token Rotation
- **Infrastructure:** Docker & Docker Compose
- **Web Server:** Nginx (Reverse Proxy)

## 🏗️ Project Architecture

The project follows a modular layered architecture. For a deep dive into the implementation details, security patterns, and deployment infrastructure, see the [Architecture Guide](file:///home/kurumi/code/temp/MTCback/spacehack-mts-cloud-backend/architecture.md).

## ⚙️ Development Setup

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env.dev` and update the values.

3. **Run Locally:**

   ```bash
   # Development mode with watch
   npm run start:dev
   ```

4. **Docker Compose:**
   ```bash
   docker-compose up -d
   ```

## 🔐 Security

- All sensitive routes are protected by `JwtGuard` and `RolesGuard`.
- Passwords are hashed using bcrypt.
- Refresh Token Rotation is implemented to prevent session hijacking.

## 📜 License

This project is licensed under the MIT License.
