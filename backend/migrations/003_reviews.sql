CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(car_id) REFERENCES cars(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_car_user_unique ON reviews(car_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_car_created ON reviews(car_id, created_at DESC);
