# API
Base URL: `http://localhost:8080/api`

## Auth
- `POST /auth/register` `{ "username": "newuser", "password": "Secret123" }`
- `POST /auth/login` `{ "username": "admin", "password": "Admin123!" }` -> `{ token, user }`
- `GET /auth/me` (Bearer)

## Cars
- `GET /cars` query: `q,category,transmission,fuel,status,minPrice,maxPrice,minYear,maxYear,seats,sort,page,limit`
- `GET /cars/:id`
- `POST /admin/cars` (admin)
- `PUT /admin/cars/:id` (admin)
- `DELETE /admin/cars/:id` (admin)

Car payload:
```json
{
  "brand":"Toyota","model":"Corolla","year":2024,"category":"sedan","transmission":"automatic","fuel":"gasoline","seats":5,
  "dailyPrice":65,"status":"available","mileage":12000,"description":"Nice car","images":["https://..."]
}
```

## Extras
- `GET /extras`

## Reservations
- `POST /reservations` (auth)
```json
{
  "carId":"...","startDate":"2026-02-20","endDate":"2026-02-23",
  "pickupLocation":"Airport","dropoffLocation":"Downtown","notes":"Late arrival",
  "extraIds":["extra-id-1","extra-id-2"]
}
```
- `GET /reservations/my`
- `PATCH /reservations/:id/cancel`

## Admin Reservations
- `GET /admin/reservations`
- `PATCH /admin/reservations/:id/status` `{ "status": "approved|denied|active|completed" }`
- `GET /admin/dashboard` -> metrics + recent reservations
