package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
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
		carID, "Tesla", "Model 3", 2023, "sedan", "automatic", "electric", 5, 80.0, "available", 5000, "test car", "[]")
	if err != nil {
		t.Fatalf("insert car: %v", err)
	}
	return carID
}

func insertTestUser(t *testing.T, db *sql.DB) string {
	t.Helper()
	userID := uuid.NewString()
	_, err := db.Exec(`INSERT INTO users(id, username, password_hash, role) VALUES(?,?,?,?)`,
		userID, "reviewer_"+userID[:6], "hash", "user")
	if err != nil {
		t.Fatalf("insert user: %v", err)
	}
	return userID
}

func TestCreateCarReviewRejectsInvalidRating(t *testing.T) {
	gin.SetMode(gin.TestMode)

	db := newTestDB(t)
	carID := insertTestCar(t, db)
	userID := insertTestUser(t, db)

	h := &Handler{
		Cars:    &repositories.CarRepository{DB: db},
		Reviews: &repositories.ReviewRepository{DB: db},
	}

	router := gin.New()
	router.POST("/cars/:id/reviews", func(c *gin.Context) {
		c.Set("userId", userID)
		c.Set("username", "reviewer")
		h.CreateCarReview(c)
	})

	for _, body := range []string{
		`{"rating":0,"comment":"bad rating"}`,
		`{"rating":6,"comment":"bad rating"}`,
	} {
		req := httptest.NewRequest(http.MethodPost, "/cars/"+carID+"/reviews", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for body %s, got %d (%s)", body, rr.Code, rr.Body.String())
		}

		var resp map[string]any
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		msg, _ := resp["error"].(string)
		if !strings.Contains(strings.ToLower(msg), "rating must be between 1 and 5") {
			t.Fatalf("unexpected validation message: %q", msg)
		}
	}
}

