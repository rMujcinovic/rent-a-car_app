package main

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
	"rentacar/backend/internal/handlers"
	"rentacar/backend/internal/middleware"
	"rentacar/backend/internal/repositories"
	"rentacar/backend/internal/services"
)

func env(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}

func sqliteDSN(raw string) string {
	if strings.Contains(raw, "?") {
		return raw + "&_busy_timeout=5000&_journal_mode=WAL"
	}
	return raw + "?_busy_timeout=5000&_journal_mode=WAL"
}

func corsOrigins() []string {
	raw := env("CORS_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173")
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func runMigrations(db *sql.DB) error {
	files, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		return err
	}
	for _, f := range files {
		b, _ := os.ReadFile(f)
		if _, err := db.Exec(string(b)); err != nil {
			return fmt.Errorf("%s: %w", f, err)
		}
	}
	return nil
}

func imageExtFromDataURL(dataURL string) string {
	switch {
	case strings.HasPrefix(dataURL, "data:image/png"):
		return ".png"
	case strings.HasPrefix(dataURL, "data:image/webp"):
		return ".webp"
	case strings.HasPrefix(dataURL, "data:image/gif"):
		return ".gif"
	default:
		return ".jpg"
	}
}

func migrateDataImages(db *sql.DB) error {
	type carRow struct {
		id    string
		image string
	}
	rows, err := db.Query(`SELECT id, images FROM cars`)
	if err != nil {
		return err
	}
	items := make([]carRow, 0, 64)

	for rows.Next() {
		var carID, imagesRaw string
		if err := rows.Scan(&carID, &imagesRaw); err != nil {
			_ = rows.Close()
			return err
		}
		items = append(items, carRow{id: carID, image: imagesRaw})
	}
	if err := rows.Close(); err != nil {
		return err
	}

	for _, item := range items {
		imagesRaw := item.image
		if strings.TrimSpace(imagesRaw) == "" {
			continue
		}
		var imgs []string
		if err := json.Unmarshal([]byte(imagesRaw), &imgs); err != nil {
			continue
		}

		changed := false
		for i, img := range imgs {
			img = strings.TrimSpace(img)
			if !strings.HasPrefix(img, "data:image/") {
				continue
			}
			parts := strings.SplitN(img, ",", 2)
			if len(parts) != 2 || !strings.Contains(parts[0], ";base64") {
				continue
			}
			raw, err := base64.StdEncoding.DecodeString(parts[1])
			if err != nil {
				continue
			}
			idPrefix := item.id
			if len(idPrefix) > 8 {
				idPrefix = idPrefix[:8]
			}
			name := fmt.Sprintf("%d_%s_%d%s", time.Now().UnixNano(), idPrefix, i, imageExtFromDataURL(img))
			dst := filepath.Join("uploads", name)
			if err := os.WriteFile(dst, raw, 0o644); err != nil {
				continue
			}
			imgs[i] = "/uploads/" + name
			changed = true
		}
		if !changed {
			continue
		}
		b, _ := json.Marshal(imgs)
		if _, err := db.Exec(`UPDATE cars SET images=? WHERE id=?`, string(b), item.id); err != nil {
			return err
		}
	}
	return nil
}

func seedDev(db *sql.DB) error {
	var c int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&c); err != nil {
		return err
	}

	if c == 0 {
		seedUsers := []struct{ U, P, R string }{{"admin", "admin", "admin"}, {"user1", "admin", "user"}, {"user2", "admin", "user"}}
		for _, u := range seedUsers {
			h, _ := bcrypt.GenerateFromPassword([]byte(u.P), bcrypt.DefaultCost)
			_, _ = db.Exec(`INSERT INTO users(id, username, password_hash, role) VALUES(lower(hex(randomblob(16))),?,?,?)`, u.U, string(h), u.R)
		}
		extra := []string{"Child seat|6", "Additional driver|12", "Insurance|15"}
		for _, e := range extra {
			p := strings.Split(e, "|")
			_, _ = db.Exec(`INSERT INTO extras(id,name,price_per_day) VALUES(lower(hex(randomblob(16))),?,?)`, p[0], p[1])
		}
		_, _ = db.Exec(`INSERT INTO cars(id,brand,model,year,category,transmission,fuel,seats,daily_price,status,mileage,description,images) VALUES
	(lower(hex(randomblob(16))),'Toyota','Corolla',2022,'sedan','automatic','gasoline',5,55,'available',32000,'Reliable city sedan','["https://images.unsplash.com/photo-1494976388531-d1058494cdd8"]'),
	(lower(hex(randomblob(16))),'BMW','X5',2023,'suv','automatic','diesel',5,120,'available',12000,'Premium SUV','["https://images.unsplash.com/photo-1555215695-3004980ad54e"]')`)
		_, _ = db.Exec(`DELETE FROM extras WHERE LOWER(TRIM(name))='gps'`)
		return nil
	}

	adminHash, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = db.Exec(`UPDATE users SET password_hash=?, role='admin' WHERE username='admin'`, string(adminHash))
	if err != nil {
		return err
	}
	var adminExists int
	if err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE username='admin'`).Scan(&adminExists); err != nil {
		return err
	}
	if adminExists == 0 {
		if _, err := db.Exec(`INSERT INTO users(id, username, password_hash, role) VALUES(lower(hex(randomblob(16))),'admin',?,'admin')`, string(adminHash)); err != nil {
			return err
		}
	}

	// GPS is intentionally removed from paid extras.
	_, _ = db.Exec(`DELETE FROM extras WHERE LOWER(TRIM(name))='gps'`)

	return nil
}

func main() {
	db, err := sql.Open("sqlite3", sqliteDSN(env("DATABASE_URL", "./rentacar.db")))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := runMigrations(db); err != nil {
		log.Fatal(err)
	}
	if err := os.MkdirAll("uploads", 0o755); err != nil {
		log.Fatal(err)
	}
	if err := migrateDataImages(db); err != nil {
		log.Fatal(err)
	}
	if err := seedDev(db); err != nil {
		log.Fatal(err)
	}

	users := &repositories.UserRepository{DB: db}
	cars := &repositories.CarRepository{DB: db}
	extras := &repositories.ExtraRepository{DB: db}
	reservations := &repositories.ReservationRepository{DB: db}
	reviews := &repositories.ReviewRepository{DB: db}
	audit := &repositories.AuditLogRepository{DB: db}
	h := &handlers.Handler{Auth: &services.AuthService{Users: users, JWTSecret: env("JWT_SECRET", "supersecret")}, Cars: cars, Extras: extras, Reservations: reservations, Reviews: reviews, Audit: audit, ReservationService: &services.ReservationService{Cars: cars, Reservations: reservations, Extras: extras}}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: corsOrigins(),
		AllowHeaders: []string{"Authorization", "Content-Type"},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
	}))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.Static("/uploads", "./uploads")
	api := r.Group("/api")
	api.POST("/auth/register", h.Register)
	api.POST("/auth/login", h.Login)
	api.GET("/cars", h.ListCars)
	api.GET("/cars/:id", h.GetCar)
	api.GET("/cars/:id/availability", h.CarAvailability)
	api.GET("/cars/:id/reviews", h.ListCarReviews)
	api.GET("/extras", h.ListExtras)
	auth := api.Group("")
	auth.Use(middleware.AuthRequired(env("JWT_SECRET", "supersecret")))
	auth.GET("/auth/me", h.Me)
	auth.POST("/reservations", h.CreateReservation)
	auth.POST("/cars/:id/reviews", h.CreateCarReview)
	auth.GET("/reservations/my", h.ListMyReservations)
	auth.PATCH("/reservations/:id/cancel", h.CancelReservation)
	admin := auth.Group("/admin")
	admin.Use(middleware.RequireRole("admin"))
	admin.POST("/cars", h.CreateCar)
	admin.POST("/uploads", h.AdminUploadImages)
	admin.PUT("/cars/:id", h.UpdateCar)
	admin.DELETE("/cars/:id", h.DeleteCar)
	admin.GET("/reservations", h.AdminListReservations)
	admin.PATCH("/reservations/:id/status", h.AdminUpdateReservationStatus)
	admin.GET("/dashboard", h.AdminDashboard)
	admin.GET("/audit-logs", h.AdminAuditLogs)
	log.Fatal(r.Run(":" + env("PORT", "8080")))
}
