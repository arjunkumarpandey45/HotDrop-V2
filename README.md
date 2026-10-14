# HotDrop V2

HotDrop V2 is a full-stack developer social platform where users can share project drops, discover other builders, follow profiles, and track project link health.

## Project Overview

This repository contains two applications:

- **`hotdrop-frontend`**: React + Vite client
- **`hotdrop-backend`**: Spring Boot API with PostgreSQL, Redis, WebSocket notifications, and scheduled link tracking

Core capabilities include:

- User signup/login/logout, email verification, and password reset via OTP
- JWT-based auth using secure cookies and refresh-token rotation
- Public feed with pagination, search, likes, comments, and sharing
- User profiles, follow/follower system, and user suggestions
- Real-time + polled notifications using STOMP/SockJS
- Developer analytics dashboard
- Project link verification + periodic uptime checks with notifications/email alerts
- Observability with Actuator + Prometheus (+ optional Grafana via Docker Compose)

## Tech Stack

### Frontend

- React 19
- Vite 8
- React Router
- Zustand
- Axios
- Tailwind CSS 4
- STOMP + SockJS for live notifications

### Backend

- Java 21
- Spring Boot 3.5
- Spring Security, Spring Data JPA, Spring WebSocket, Spring Mail
- PostgreSQL + Flyway migrations
- Redis (cache + token blacklist/rate limit support)
- Bucket4j (rate limiting)
- JWT (jjwt)
- Cloudinary (image uploads)
- Micrometer + Prometheus

## Repository Structure

```text
HotDrop-V2/
├── README.md
├── hotdrop-frontend/
│   ├── src/
│   ├── package.json
│   └── env.example
└── hotdrop-backend/
    ├── src/main/java/com/arjun/hotdrop_backend/
    ├── src/main/resources/application.yaml
    ├── src/main/resources/db/migration/
    ├── .env.example
    ├── docker-compose.yml
    └── monitoring/prometheus.yml
```

## Setup Instructions

### 1) Clone repository

```bash
git clone https://github.com/arjunkumarpandey45/HotDrop-V2.git
cd HotDrop-V2
```

### 2) Backend Setup (`hotdrop-backend`)

### Prerequisites

- Java 21
- PostgreSQL
- Redis

### Environment variables

Copy and fill backend env values:

```bash
cd hotdrop-backend
cp .env.example .env
```

Expected variables from `.env.example`:

- `POSTGRES_SQL_URI`
- `POSTGRES_SQL_USER`
- `POSTGRES_SQL_PASS`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_EXPIRY_TIME`
- `SECRET_KEY`
- `JWT_EXPIRY`
- `EMAIL_TOKEN_EXPIRY`
- `REFRESH_TOKEN_EXPIRATION`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ONE_IMAGE_SIZE`
- `TOTAL_IMAGE_SIZE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `BREVO_API_KEY`
- `GRAFANA_ADMIN_USER`
- `GRAFANA_ADMIN_PASSWORD`

### Run backend

```bash
./mvnw spring-boot:run
```

The backend runs on **`http://localhost:8080`** by default.

### Backend useful endpoints

- Health: `GET /actuator/health`
- Prometheus metrics: `GET /actuator/prometheus`
- Swagger UI: `GET /swagger-ui.html`

### 3) Frontend Setup (`hotdrop-frontend`)

### Prerequisites

- Node.js (LTS recommended)
- npm

### Environment variables

```bash
cd ../hotdrop-frontend
cp env.example .env
```

Set:

- `VITE_BACKEND_URL` (example: `http://localhost:8080`)
- `VITE_FRONTEND_URL`
- `VITE_EMAILJS_PUBLIC_KEY`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`

### Run frontend

```bash
npm install
npm run dev
```

Frontend default dev server is **`http://localhost:5173`**.

## Scripts

### Frontend scripts

From `hotdrop-frontend`:

- `npm run dev` – start dev server
- `npm run build` – create production build
- `npm run preview` – preview production build locally
- `npm run lint` – run ESLint

### Backend scripts

From `hotdrop-backend`:

- `./mvnw spring-boot:run` – run app
- `./mvnw test` – run tests
- `./mvnw clean package` – build JAR

## API Domain Overview

- **Auth**: `/auth/*` (signup, login, refresh, verify-email, resend-email, forgot-password, verify-otp, logout)
- **Posts**: `/posts/*` (feed, create, like, comment, share, link verification)
- **Users**: `/users/*` (search, profile, follow, followers/following, suggestions, me)
- **Notifications**: `/notifications/*` (list, unread count, mark read/all read)
- **Analytics**: `/api/v1/developer/dashboard/stats`

## Monitoring Stack (Optional)

`hotdrop-backend/docker-compose.yml` includes:

- Prometheus on `9090`
- Grafana on `3000`
- Redis on `6379`

Run from `hotdrop-backend`:

```bash
docker compose up -d
```

Prometheus scrapes backend metrics from `http://host.docker.internal:8080/actuator/prometheus`.

## Security Notes

- Stateless JWT auth using cookies + refresh token rotation
- Rate limiting on sensitive/public endpoints
- Blacklisting flow for email-verification tokens in Redis
- Auth-protected write operations for posts and profiles

## Recent Authentication & Session Security Hardening

- **True Stateless Multi-Device Sessions**
  - Removed global `isLoggedIn` coupling
  - Device-scoped refresh token persistence

- **Refresh Token Rotation**
  - Single-use refresh token rotation on `/auth/refresh`

- **JWT Purpose Claim Separation**
  - Distinct token-purpose claims for auth and email verification

- **Redis Token Blacklisting with TTL**
  - Dynamic TTL based on token remaining lifespan

- **Performance and Layer Decoupling**
  - Consolidated auth result flow and service-layer token handling

- **Defensive Cookie and Endpoint Scoping**
  - Hardened cookie attributes and endpoint access behavior

## Contributing

1. Fork and create a feature branch
2. Make focused changes
3. Run lint/tests locally
4. Open a pull request
