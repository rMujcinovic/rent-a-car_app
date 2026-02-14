# Setup

## Prerequisites
- Go 1.22+
- Node 20+

## Backend
```bash
cd backend
go mod tidy
go run ./cmd/api
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Migrations & Seed
Migrations in `backend/migrations/*.sql` run at startup.
Seed users/cars/extras are inserted when `users` table is empty.
