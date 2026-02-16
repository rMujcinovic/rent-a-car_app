package services

import (
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
	"rentacar/backend/internal/models"
	"rentacar/backend/internal/repositories"
)

func newTestDB(t *testing.T) *sql.DB {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	runMigrationsForTest(t, db)
	return db
}

func runMigrationsForTest(t *testing.T, db *sql.DB) {
	t.Helper()

	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	root := filepath.Join(filepath.Dir(thisFile), "..", "..")
	files := []string{
		filepath.Join(root, "migrations", "001_init.sql"),
		filepath.Join(root, "migrations", "002_audit_logs.sql"),
		filepath.Join(root, "migrations", "003_reviews.sql"),
	}
	for _, f := range files {
		sqlBytes, err := os.ReadFile(f)
		if err != nil {
			t.Fatalf("read migration %s: %v", f, err)
		}
		if _, err := db.Exec(string(sqlBytes)); err != nil {
			t.Fatalf("exec migration %s: %v", f, err)
		}
	}
}

func insertTestCar(t *testing.T, db *sql.DB) string {
	t.Helper()
	carID := uuid.NewString()
	_, err := db.Exec(`INSERT INTO cars(id, brand, model, year, category, transmission, fuel, seats, daily_price, status, mileage, description, images)
	VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		carID, "Toyota", "Corolla", 2022, "sedan", "automatic", "gasoline", 5, 50.0, "available", 10000, "test car", "[]")
	if err != nil {
		t.Fatalf("insert car: %v", err)
	}
	return carID
}

func insertTestUser(t *testing.T, db *sql.DB) string {
	t.Helper()
	userID := uuid.NewString()
	hash, err := bcrypt.GenerateFromPassword([]byte("irrelevant"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("bcrypt: %v", err)
	}
	_, err = db.Exec(`INSERT INTO users(id, username, password_hash, role) VALUES(?,?,?,?)`, userID, "u_"+userID[:8], string(hash), "user")
	if err != nil {
		t.Fatalf("insert user: %v", err)
	}
	return userID
}

func insertReservationWithStatus(t *testing.T, db *sql.DB, carID, userID, status string, start, end time.Time) {
	t.Helper()
	_, err := db.Exec(`INSERT INTO reservations(id, car_id, user_id, start_date, end_date, pickup_location, dropoff_location, notes, status, total_price)
	VALUES(?,?,?,?,?,?,?,?,?,?)`,
		uuid.NewString(), carID, userID, start, end, "A", "B", "", status, 100.0)
	if err != nil {
		t.Fatalf("insert reservation (%s): %v", status, err)
	}
}

func TestAuthRegisterStoresBcryptHash(t *testing.T) {
	db := newTestDB(t)
	svc := &AuthService{
		Users:     &repositories.UserRepository{DB: db},
		JWTSecret: "test-secret",
	}

	const username = "alice"
	const password = "secret123"

	if err := svc.Register(username, password); err != nil {
		t.Fatalf("register failed: %v", err)
	}

	var storedHash string
	if err := db.QueryRow(`SELECT password_hash FROM users WHERE username=?`, username).Scan(&storedHash); err != nil {
		t.Fatalf("query stored hash: %v", err)
	}
	if storedHash == password {
		t.Fatalf("stored hash must not equal plaintext password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		t.Fatalf("stored hash is not valid bcrypt for password: %v", err)
	}
}

func TestAuthLoginSuccessAndWrongPassword(t *testing.T) {
	db := newTestDB(t)
	svc := &AuthService{
		Users:     &repositories.UserRepository{DB: db},
		JWTSecret: "test-secret",
	}

	const username = "bob"
	const password = "strong-pass"
	if err := svc.Register(username, password); err != nil {
		t.Fatalf("register failed: %v", err)
	}

	token, user, err := svc.Login(username, password)
	if err != nil {
		t.Fatalf("login with correct credentials failed: %v", err)
	}
	if token == "" {
		t.Fatalf("expected non-empty token")
	}
	if user == nil || user.Username != username {
		t.Fatalf("unexpected user from login: %#v", user)
	}

	_, _, err = svc.Login(username, "wrong-password")
	if err == nil {
		t.Fatalf("expected error for wrong password")
	}
	if !strings.Contains(strings.ToLower(err.Error()), "invalid credentials") {
		t.Fatalf("unexpected wrong-password error: %v", err)
	}
}

func TestReservationCreateRejectsOverlapForBlockingStatuses(t *testing.T) {
	blocking := []string{"pending", "approved", "active"}
	for _, status := range blocking {
		t.Run(status, func(t *testing.T) {
			db := newTestDB(t)
			carID := insertTestCar(t, db)
			userID := insertTestUser(t, db)

			startExisting := time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC)
			endExisting := time.Date(2026, 1, 12, 0, 0, 0, 0, time.UTC)
			insertReservationWithStatus(t, db, carID, userID, status, startExisting, endExisting)

			svc := &ReservationService{
				Cars:         &repositories.CarRepository{DB: db},
				Reservations: &repositories.ReservationRepository{DB: db},
				Extras:       &repositories.ExtraRepository{DB: db},
			}

			err := svc.Create(&models.Reservation{
				CarID:           carID,
				UserID:          userID,
				StartDate:       time.Date(2026, 1, 11, 0, 0, 0, 0, time.UTC),
				EndDate:         time.Date(2026, 1, 13, 0, 0, 0, 0, time.UTC),
				PickupLocation:  "A",
				DropoffLocation: "B",
			}, nil)
			if err == nil {
				t.Fatalf("expected overlap error for status=%s", status)
			}
			if !strings.Contains(strings.ToLower(err.Error()), "already reserved") {
				t.Fatalf("unexpected overlap error: %v", err)
			}
		})
	}
}

func TestReservationCreateAllowsNonOverlappingAndNonBlockingStatuses(t *testing.T) {
	t.Run("non-overlapping should succeed", func(t *testing.T) {
		db := newTestDB(t)
		carID := insertTestCar(t, db)
		userID := insertTestUser(t, db)

		insertReservationWithStatus(
			t, db, carID, userID, "pending",
			time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC),
			time.Date(2026, 1, 12, 0, 0, 0, 0, time.UTC),
		)

		svc := &ReservationService{
			Cars:         &repositories.CarRepository{DB: db},
			Reservations: &repositories.ReservationRepository{DB: db},
			Extras:       &repositories.ExtraRepository{DB: db},
		}

		err := svc.Create(&models.Reservation{
			CarID:           carID,
			UserID:          userID,
			StartDate:       time.Date(2026, 1, 12, 0, 0, 0, 0, time.UTC), // boundary, should not overlap
			EndDate:         time.Date(2026, 1, 14, 0, 0, 0, 0, time.UTC),
			PickupLocation:  "A",
			DropoffLocation: "B",
		}, nil)
		if err != nil {
			t.Fatalf("expected non-overlapping reservation to succeed, got: %v", err)
		}
	})

	for _, status := range []string{"cancelled", "denied"} {
		t.Run("overlap allowed when existing is "+status, func(t *testing.T) {
			db := newTestDB(t)
			carID := insertTestCar(t, db)
			userID := insertTestUser(t, db)

			insertReservationWithStatus(
				t, db, carID, userID, status,
				time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC),
				time.Date(2026, 1, 12, 0, 0, 0, 0, time.UTC),
			)

			svc := &ReservationService{
				Cars:         &repositories.CarRepository{DB: db},
				Reservations: &repositories.ReservationRepository{DB: db},
				Extras:       &repositories.ExtraRepository{DB: db},
			}

			err := svc.Create(&models.Reservation{
				CarID:           carID,
				UserID:          userID,
				StartDate:       time.Date(2026, 1, 11, 0, 0, 0, 0, time.UTC),
				EndDate:         time.Date(2026, 1, 13, 0, 0, 0, 0, time.UTC),
				PickupLocation:  "A",
				DropoffLocation: "B",
			}, nil)
			if err != nil {
				t.Fatalf("expected overlap with status=%s not to block, got: %v", status, err)
			}
		})
	}
}

func TestAuthRegisterDuplicateUsername(t *testing.T) {
	db := newTestDB(t)
	svc := &AuthService{
		Users:     &repositories.UserRepository{DB: db},
		JWTSecret: "test-secret",
	}

	if err := svc.Register("duplicate_user", "secret123"); err != nil {
		t.Fatalf("first register failed: %v", err)
	}
	err := svc.Register("duplicate_user", "secret123")
	if !errors.Is(err, ErrUsernameExists) {
		t.Fatalf("expected ErrUsernameExists, got: %v", err)
	}
}

