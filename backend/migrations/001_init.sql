CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  transmission TEXT NOT NULL,
  fuel TEXT NOT NULL,
  seats INTEGER NOT NULL,
  daily_price REAL NOT NULL,
  status TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  description TEXT,
  images TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL,
  total_price REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(car_id) REFERENCES cars(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS extras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_day REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation_extras (
  reservation_id TEXT NOT NULL,
  extra_id TEXT NOT NULL,
  PRIMARY KEY(reservation_id, extra_id),
  FOREIGN KEY(reservation_id) REFERENCES reservations(id),
  FOREIGN KEY(extra_id) REFERENCES extras(id)
);
