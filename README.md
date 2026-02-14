# Rent-a-Car Monorepo

Full-stack rent-a-car app with React+TypeScript frontend and Go+Gin backend.

## Demo Credentials
- admin / Admin123!
- user1 / User123!
- user2 / User123!

## Local setup
1. Backend
   - `cd backend`
   - `cp .env.example .env` (optional)
   - `go mod tidy`
   - `go run ./cmd/api`
2. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`

Backend runs migrations and seed automatically at startup when DB is empty.

## Routes
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

## Docker Compose
- `docker compose up`

See `docs/SETUP.md` and `docs/API.md` for details.
