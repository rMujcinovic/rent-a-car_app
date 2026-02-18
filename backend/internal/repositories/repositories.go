package repositories

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"rentacar/backend/internal/models"
)

type UserRepository struct{ DB *sql.DB }
type CarRepository struct{ DB *sql.DB }
type ReservationRepository struct{ DB *sql.DB }
type ExtraRepository struct{ DB *sql.DB }
type AuditLogRepository struct{ DB *sql.DB }
type ReviewRepository struct{ DB *sql.DB }

var usePostgres = func() bool {
	dsn := strings.ToLower(strings.TrimSpace(os.Getenv("DATABASE_URL")))
	return strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://")
}()

func bind(q string) string {
	if !usePostgres || !strings.Contains(q, "?") {
		return q
	}
	var b strings.Builder
	b.Grow(len(q) + 8)
	n := 1
	for i := 0; i < len(q); i++ {
		if q[i] == '?' {
			b.WriteString(fmt.Sprintf("$%d", n))
			n++
			continue
		}
		b.WriteByte(q[i])
	}
	return b.String()
}

func (r *UserRepository) Create(username, password, role string) (*models.User, error) {
	id := uuid.NewString()
	_, err := r.DB.Exec(bind(`INSERT INTO users(id, username, password_hash, role) VALUES(?,?,?,?)`), id, username, password, role)
	if err != nil {
		return nil, err
	}
	return &models.User{ID: id, Username: username, Role: role, CreatedAt: time.Now().UTC()}, nil
}
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	row := r.DB.QueryRow(bind(`SELECT id, username, password_hash, role, created_at FROM users WHERE username=?`), username)
	u := models.User{}
	if err := row.Scan(&u.ID, &u.Username, &u.Password, &u.Role, &u.CreatedAt); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *CarRepository) Create(car *models.Car) error {
	car.ID = uuid.NewString()
	img, _ := json.Marshal(car.Images)
	_, err := r.DB.Exec(bind(`INSERT INTO cars(id, brand, model, year, category, transmission, fuel, seats, daily_price, status, mileage, description, images)
	VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`), car.ID, car.Brand, car.Model, car.Year, car.Category, car.Transmission, car.Fuel, car.Seats, car.DailyPrice, car.Status, car.Mileage, car.Description, string(img))
	return err
}
func (r *CarRepository) Update(id string, car *models.Car) error {
	img, _ := json.Marshal(car.Images)
	_, err := r.DB.Exec(bind(`UPDATE cars SET brand=?, model=?, year=?, category=?, transmission=?, fuel=?, seats=?, daily_price=?, status=?, mileage=?, description=?, images=? WHERE id=?`),
		car.Brand, car.Model, car.Year, car.Category, car.Transmission, car.Fuel, car.Seats, car.DailyPrice, car.Status, car.Mileage, car.Description, string(img), id)
	return err
}
func (r *CarRepository) Delete(id string) error {
	_, err := r.DB.Exec(bind(`DELETE FROM cars WHERE id=?`), id)
	return err
}
func (r *CarRepository) UpdateStatus(id, status string) error {
	_, err := r.DB.Exec(bind(`UPDATE cars SET status=? WHERE id=?`), status, id)
	return err
}
func scanCar(rows *sql.Rows) (models.Car, error) {
	var c models.Car
	var images string
	err := rows.Scan(&c.ID, &c.Brand, &c.Model, &c.Year, &c.Category, &c.Transmission, &c.Fuel, &c.Seats, &c.DailyPrice, &c.Status, &c.Mileage, &c.Description, &images, &c.CreatedAt)
	if err == nil && images != "" {
		_ = json.Unmarshal([]byte(images), &c.Images)
	}
	return c, err
}
func (r *CarRepository) List(filters map[string]string, limit, offset int, sort string) ([]models.Car, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	for _, k := range []string{"category", "transmission", "fuel", "status"} {
		if v := filters[k]; v != "" {
			where = append(where, fmt.Sprintf("LOWER(%s)=LOWER(?)", k))
			args = append(args, v)
		}
	}
	if v := filters["brand"]; v != "" {
		where = append(where, "LOWER(brand)=LOWER(?)")
		args = append(args, v)
	}
	if v := filters["model"]; v != "" {
		where = append(where, "LOWER(model) LIKE LOWER(?)")
		args = append(args, "%"+v+"%")
	}
	if q := filters["q"]; q != "" {
		terms := strings.Fields(strings.ToLower(strings.TrimSpace(q)))
		for _, term := range terms {
			// Match token at start of full name or start of any word inside full name (brand + model).
			where = append(where, "(LOWER(brand || ' ' || model) LIKE ? OR LOWER(brand || ' ' || model) LIKE ?)")
			args = append(args, term+"%", "% "+term+"%")
		}
	}
	if v := filters["minPrice"]; v != "" {
		where = append(where, "daily_price>=?")
		args = append(args, v)
	}
	if v := filters["maxPrice"]; v != "" {
		where = append(where, "daily_price<=?")
		args = append(args, v)
	}
	if v := filters["minYear"]; v != "" {
		where = append(where, "year>=?")
		args = append(args, v)
	}
	if v := filters["maxYear"]; v != "" {
		where = append(where, "year<=?")
		args = append(args, v)
	}
	if v := filters["minMileage"]; v != "" {
		where = append(where, "mileage>=?")
		args = append(args, v)
	}
	if v := filters["maxMileage"]; v != "" {
		where = append(where, "mileage<=?")
		args = append(args, v)
	}
	if v := filters["seats"]; v != "" {
		where = append(where, "seats>=?")
		args = append(args, v)
	}
	order := "created_at DESC"
	if sort == "price_asc" {
		order = "daily_price ASC"
	} else if sort == "price_desc" {
		order = "daily_price DESC"
	} else if sort == "year" {
		order = "year DESC"
	}
	w := strings.Join(where, " AND ")
	countRow := r.DB.QueryRow(bind("SELECT COUNT(*) FROM cars WHERE "+w), args...)
	var total int
	_ = countRow.Scan(&total)
	args2 := append(args, limit, offset)
	rows, err := r.DB.Query(bind("SELECT id, brand, model, year, category, transmission, fuel, seats, daily_price, status, mileage, description, images, created_at FROM cars WHERE "+w+" ORDER BY "+order+" LIMIT ? OFFSET ?"), args2...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []models.Car{}
	for rows.Next() {
		c, err := scanCar(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	return out, total, nil
}
func (r *CarRepository) GetByID(id string) (*models.Car, error) {
	rows, err := r.DB.Query(bind("SELECT id, brand, model, year, category, transmission, fuel, seats, daily_price, status, mileage, description, images, created_at FROM cars WHERE id=?"), id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if rows.Next() {
		c, err := scanCar(rows)
		if err != nil {
			return nil, err
		}
		return &c, nil
	}
	return nil, sql.ErrNoRows
}

func (r *ExtraRepository) List() ([]models.Extra, error) {
	rows, err := r.DB.Query(`SELECT id, name, price_per_day FROM extras ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Extra{}
	for rows.Next() {
		var e models.Extra
		if err := rows.Scan(&e.ID, &e.Name, &e.PricePerDay); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, nil
}
func (r *ExtraRepository) ByIDs(ids []string) ([]models.Extra, error) {
	if len(ids) == 0 {
		return []models.Extra{}, nil
	}
	ph := strings.Repeat("?,", len(ids))
	ph = ph[:len(ph)-1]
	args := make([]interface{}, len(ids))
	for i, v := range ids {
		args[i] = v
	}
	rows, err := r.DB.Query(bind("SELECT id,name,price_per_day FROM extras WHERE id IN ("+ph+")"), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Extra{}
	for rows.Next() {
		var e models.Extra
		_ = rows.Scan(&e.ID, &e.Name, &e.PricePerDay)
		out = append(out, e)
	}
	return out, nil
}

func (r *ReservationRepository) Create(res *models.Reservation, extraIDs []string) error {
	res.ID = uuid.NewString()
	tx, _ := r.DB.Begin()
	_, err := tx.Exec(bind(`INSERT INTO reservations(id, car_id, user_id, start_date, end_date, pickup_location, dropoff_location, notes, status, total_price)
	VALUES(?,?,?,?,?,?,?,?,?,?)`), res.ID, res.CarID, res.UserID, res.StartDate, res.EndDate, res.PickupLocation, res.DropoffLocation, res.Notes, res.Status, res.TotalPrice)
	if err != nil {
		_ = tx.Rollback()
		return err
	}
	for _, e := range extraIDs {
		_, err = tx.Exec(bind(`INSERT INTO reservation_extras(reservation_id, extra_id) VALUES(?,?)`), res.ID, e)
		if err != nil {
			_ = tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
func (r *ReservationRepository) HasOverlap(carID string, start, end time.Time) (bool, error) {
	row := r.DB.QueryRow(bind(`SELECT COUNT(*) FROM reservations WHERE car_id=? AND status IN ('pending','approved','active') AND NOT (end_date <= ? OR start_date >= ?)`), carID, start, end)
	var c int
	err := row.Scan(&c)
	return c > 0, err
}
func (r *ReservationRepository) UpdateStatus(id, status string) error {
	_, err := r.DB.Exec(bind(`UPDATE reservations SET status=? WHERE id=?`), status, id)
	return err
}
func (r *ReservationRepository) HasBlockingForCar(carID string) (bool, error) {
	row := r.DB.QueryRow(bind(`SELECT COUNT(*) FROM reservations WHERE car_id=? AND status IN ('pending','approved','active')`), carID)
	var c int
	err := row.Scan(&c)
	return c > 0, err
}
func (r *ReservationRepository) ListBlockedRangesByCar(carID string) ([]models.Reservation, error) {
	rows, err := r.DB.Query(bind(`SELECT id,car_id,user_id,start_date,end_date,pickup_location,dropoff_location,notes,status,total_price,created_at FROM reservations WHERE car_id=? AND status IN ('pending','approved','active') ORDER BY start_date ASC`), carID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Reservation{}
	for rows.Next() {
		var re models.Reservation
		if err := rows.Scan(&re.ID, &re.CarID, &re.UserID, &re.StartDate, &re.EndDate, &re.PickupLocation, &re.DropoffLocation, &re.Notes, &re.Status, &re.TotalPrice, &re.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, re)
	}
	return out, nil
}
func (r *ReservationRepository) List(userID string, all bool) ([]models.Reservation, error) {
	q := `SELECT r.id,r.car_id,r.user_id,r.start_date,r.end_date,r.pickup_location,r.dropoff_location,r.notes,r.status,r.total_price,r.created_at,u.username,c.brand,c.model,c.daily_price
	FROM reservations r JOIN users u ON u.id=r.user_id JOIN cars c ON c.id=r.car_id`
	args := []interface{}{}
	if !all {
		q += " WHERE r.user_id=?"
		args = append(args, userID)
	}
	q += " ORDER BY r.created_at DESC LIMIT 50"
	rows, err := r.DB.Query(bind(q), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Reservation{}
	for rows.Next() {
		var re models.Reservation
		var car models.Car
		if err := rows.Scan(&re.ID, &re.CarID, &re.UserID, &re.StartDate, &re.EndDate, &re.PickupLocation, &re.DropoffLocation, &re.Notes, &re.Status, &re.TotalPrice, &re.CreatedAt, &re.Username, &car.Brand, &car.Model, &car.DailyPrice); err != nil {
			return nil, err
		}
		re.Car = &car
		out = append(out, re)
	}
	return out, nil
}
func (r *ReservationRepository) GetByID(id string) (*models.Reservation, error) {
	row := r.DB.QueryRow(bind(`SELECT id,car_id,user_id,start_date,end_date,pickup_location,dropoff_location,notes,status,total_price,created_at FROM reservations WHERE id=?`), id)
	var re models.Reservation
	if err := row.Scan(&re.ID, &re.CarID, &re.UserID, &re.StartDate, &re.EndDate, &re.PickupLocation, &re.DropoffLocation, &re.Notes, &re.Status, &re.TotalPrice, &re.CreatedAt); err != nil {
		return nil, err
	}
	return &re, nil
}
func (r *ReservationRepository) Metrics() (map[string]float64, error) {
	m := map[string]float64{}
	queries := map[string]string{"totalCars": "SELECT COUNT(*) FROM cars", "availableCars": "SELECT COUNT(*) FROM cars WHERE status='available'", "activeRentals": "SELECT COUNT(*) FROM reservations WHERE status='active'", "pendingReservations": "SELECT COUNT(*) FROM reservations WHERE status='pending'", "revenue": "SELECT COALESCE(SUM(total_price),0) FROM reservations WHERE status IN ('completed','active','approved')"}
	for k, q := range queries {
		var v float64
		if err := r.DB.QueryRow(q).Scan(&v); err != nil {
			return nil, err
		}
		m[k] = v
	}
	return m, nil
}
func (r *ReservationRepository) ExtrasForReservation(resID string) ([]models.Extra, error) {
	rows, err := r.DB.Query(bind(`SELECT e.id,e.name,e.price_per_day FROM reservation_extras re JOIN extras e ON e.id=re.extra_id WHERE re.reservation_id=?`), resID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Extra{}
	for rows.Next() {
		var e models.Extra
		_ = rows.Scan(&e.ID, &e.Name, &e.PricePerDay)
		out = append(out, e)
	}
	return out, nil
}

func (r *AuditLogRepository) Create(actorID, actorName, action, entity, entityID, details string) error {
	_, err := r.DB.Exec(bind(`INSERT INTO audit_logs(id, actor_id, actor_name, action, entity, entity_id, details) VALUES(?,?,?,?,?,?,?)`),
		uuid.NewString(), actorID, actorName, action, entity, entityID, details)
	return err
}

func (r *AuditLogRepository) ListRecent(limit int) ([]models.AuditLog, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.DB.Query(bind(`SELECT id,actor_id,actor_name,action,entity,entity_id,details,created_at FROM audit_logs ORDER BY created_at DESC LIMIT ?`), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.AuditLog{}
	for rows.Next() {
		var a models.AuditLog
		if err := rows.Scan(&a.ID, &a.ActorID, &a.ActorName, &a.Action, &a.Entity, &a.EntityID, &a.Details, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, nil
}

func (r *ReviewRepository) ListByCar(carID string) ([]models.Review, float64, int, error) {
	rows, err := r.DB.Query(bind(`
		SELECT rv.id, rv.car_id, rv.user_id, u.username, rv.rating, COALESCE(rv.comment, ''), rv.created_at
		FROM reviews rv
		JOIN users u ON u.id = rv.user_id
		WHERE rv.car_id=?
		ORDER BY rv.created_at DESC`), carID)
	if err != nil {
		return nil, 0, 0, err
	}
	defer rows.Close()
	items := []models.Review{}
	for rows.Next() {
		var it models.Review
		if err := rows.Scan(&it.ID, &it.CarID, &it.UserID, &it.Username, &it.Rating, &it.Comment, &it.CreatedAt); err != nil {
			return nil, 0, 0, err
		}
		items = append(items, it)
	}

	var avg sql.NullFloat64
	var total int
	if err := r.DB.QueryRow(bind(`SELECT AVG(CAST(rating as DOUBLE PRECISION)), COUNT(*) FROM reviews WHERE car_id=?`), carID).Scan(&avg, &total); err != nil {
		return nil, 0, 0, err
	}
	avgRating := 0.0
	if avg.Valid {
		avgRating = avg.Float64
	}
	return items, avgRating, total, nil
}

func (r *ReviewRepository) Create(carID, userID string, rating int, comment string) error {
	_, err := r.DB.Exec(bind(`INSERT INTO reviews(id, car_id, user_id, rating, comment) VALUES(?,?,?,?,?)`),
		uuid.NewString(), carID, userID, rating, comment)
	return err
}
