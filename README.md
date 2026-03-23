# RentACar Pro

Full-stack rent-a-car web application built with React, TypeScript, Vite, Tailwind CSS, Go, and Gin.

The project includes both customer-facing and admin workflows: authentication, car browsing, reservations, extras, reviews, wishlist, vehicle management, reservation status management, dashboard metrics, and audit logs.

## Status

This application is currently intended to be run locally.

The previous Railway deployment is no longer active because the free trial expired, so the live demo is not available at the moment. Everything needed to run the project locally is documented below.

## Demo

### Landing Page

Shows the public-facing landing page and initial presentation of the application.

![Landing Page Demo](./docs/gifs/landingpage.gif)

### User Flow

Shows the customer experience, including browsing cars, wishlist usage, reservations, and reservation tracking.

![User Flow Demo](./docs/gifs/usergif.gif)

### Admin Flow

Shows the admin workflow, including reservation management, dashboard metrics, and audit log activity.

![Admin Flow Demo](./docs/gifs/admingif.gif)

## Features

- User registration and login with JWT-based authentication
- Role-based access control for admin-only routes
- Car catalog with search, filtering, sorting, and pagination
- Detailed car pages with gallery, availability overview, and pricing
- Reservation flow with pickup/drop-off locations and optional extras
- Personal reservations page with cancellation support
- Wishlist functionality for logged-in users
- Review and rating system for cars
- Admin dashboard with key business metrics
- Admin reservation management with status updates
- Admin car management and image uploads
- Audit logs for administrative actions
- SQLite by default, with PostgreSQL-ready database support
- Dockerized local development setup

## Tech Stack

**Frontend**

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack React Query
- React Hook Form
- Zod
- Axios
- React Hot Toast
- Leaflet / React Leaflet

**Backend**

- Go
- Gin
- JWT authentication
- bcrypt password hashing
- SQLite
- PostgreSQL driver support

**DevOps / Tooling**

- Docker
- Docker Compose

## Project Structure

```text
rent-a-car_app/
|- frontend/    # React + TypeScript client
|- backend/     # Go + Gin REST API
|- docs/        # Setup and API notes
|- docker-compose.yml
```

## Demo Accounts

These accounts are seeded automatically when the database is empty:

- `admin / admin`
- `user1 / User123!`
- `user2 / User123!`

## Local Setup

### Prerequisites

- Node.js 20+
- Go 1.22+

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rent-a-car_app
```

### 2. Backend setup

```bash
cd backend
go mod tidy
go run ./cmd/api
```

Optional: create `backend/.env` from `backend/.env.example` if you want to override defaults.

Default backend environment values:

```env
PORT=8080
JWT_SECRET=supersecret
DATABASE_URL=./rentacar.db
CORS_ORIGIN=http://localhost:5173
```

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

If needed, you can manually create a frontend `.env` with:

```env
VITE_API_URL=http://localhost:8080/api
```

### 4. Open the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api`
- Health check: `http://localhost:8080/health`

## Docker Setup

If you prefer running the whole stack with Docker:

```bash
docker compose up
```

This starts:

- frontend on `http://localhost:5173`
- backend on `http://localhost:8080`

## Database and Seed Behavior

- Migrations in `backend/migrations/*.sql` run automatically when the backend starts
- Seed data is inserted automatically when the `users` table is empty
- SQLite is used by default for local development
- The backend supports PostgreSQL-style `DATABASE_URL` configuration as well

## API Overview

Base URL:

```text
http://localhost:8080/api
```

Main route groups:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /cars`
- `GET /cars/:id`
- `GET /cars/:id/availability`
- `GET /cars/:id/reviews`
- `GET /extras`
- `POST /reservations`
- `GET /reservations/my`
- `PATCH /reservations/:id/cancel`
- `POST /cars/:id/reviews`
- `POST /admin/cars`
- `PUT /admin/cars/:id`
- `DELETE /admin/cars/:id`
- `GET /admin/reservations`
- `PATCH /admin/reservations/:id/status`
- `GET /admin/dashboard`
- `GET /admin/audit-logs`

More details are available in:

- `docs/SETUP.md`
- `docs/API.md`

## Notes

- The landing page map uses OpenStreetMap tiles through Leaflet, so no API key is required
- Uploaded car images are served from the backend `uploads/` directory
- The seeded admin password is intentionally simple for local/demo purposes only

## Recommended README Media

The README already includes GIF demos. If you want to strengthen it even more, add static screenshots as a separate section for quick scanning.

Suggested section to add later:

```md
## Screenshots

![Landing Page](./docs/screenshots/landing.png)
![Cars Page](./docs/screenshots/cars.png)
![Car Details](./docs/screenshots/car-details.png)
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)
```

If you decide to make screenshots or GIFs, a good folder structure would be:

```text
docs/
|- screenshots/
|- gifs/
```

## Future Improvements

- Re-deploy the application to a public hosting platform
- Add automated CI test coverage for frontend and backend flows
- Move wishlist persistence from local storage to the backend
- Add online payments and booking confirmation emails

## Author

Created as a portfolio full-stack project focused on real-world booking, administration, and REST API workflows.
