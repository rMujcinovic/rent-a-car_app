# Rent-a-Car Monorepo

Full-stack rent-a-car app with React+TypeScript frontend and Go+Gin backend.

## Demo Credentials
- admin / admin
- user1 / User123!
- user2 / User123!

## Local setuptre
1. Backend
   - `cd backend`
   - `cp .env.example .env` (optional)
   - `go mod tidy`
   - `go run ./cmd/api`
2. Frontend
   - `cd frontend`
   - `cp .env.example .env` (optional)
   - `npm install`
   - `npm run dev`

Landing page map uses free OpenStreetMap tiles (Leaflet), so no API key is required.

Backend runs migrations and seed automatically at startup when DB is empty.

## Routes
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

## Docker Compose
- `docker compose up`

## Railway Deployment (Backend + Frontend)
1. Push this repo to GitHub (branch you want to deploy).
2. In Railway, create a new project from GitHub repo.
3. Add backend service:
   - Root directory: `backend`
   - Uses `backend/Dockerfile`
   - Set environment variables:
     - `PORT=8080`
     - `JWT_SECRET=<your-strong-secret>`
     - `DATABASE_URL=<Railway PostgreSQL DATABASE_URL>`
     - `CORS_ORIGIN=https://your-frontend-url.up.railway.app`
4. Add frontend service:
   - Root directory: `frontend`
   - Uses `frontend/Dockerfile`
   - Set environment variable:
     - `VITE_API_URL=https://your-backend-url.up.railway.app/api`
5. Deploy both services and use frontend URL as your public app URL.

### Required Environment Variables
- Backend:
  - `PORT`
  - `JWT_SECRET`
  - `CORS_ORIGIN`
  - `DATABASE_URL`
- Frontend:
  - `VITE_API_URL`

### SQLite Note (Important)
- This project uses SQLite by default.
- For production on Railway, use PostgreSQL service and set `DATABASE_URL` from that service.
- SQLite on Railway is ephemeral unless you attach a persistent volume to backend service.
- Without persistent volume, SQLite database/uploads can be lost on redeploy/restart.

### Health Check

- Backend exposes `GET /health` and returns `200 OK` with `{ "status": "ok" }`.
See `docs/SETUP.md` and `docs/API.md` for details.
