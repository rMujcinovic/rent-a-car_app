package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

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
func seedDev(db *sql.DB) error {
	var c int
	_ = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&c)
	if c > 0 {
		return nil
	}
	seedUsers := []struct{ U, P, R string }{{"admin", "Admin123!", "admin"}, {"user1", "User123!", "user"}, {"user2", "User123!", "user"}}
	for _, u := range seedUsers {
		h, _ := bcrypt.GenerateFromPassword([]byte(u.P), bcrypt.DefaultCost)
		_, _ = db.Exec(`INSERT INTO users(id, username, password_hash, role) VALUES(lower(hex(randomblob(16))),?,?,?)`, u.U, string(h), u.R)
	}
	extra := []string{"GPS|8", "Child seat|6", "Additional driver|12", "Insurance|15"}
	for _, e := range extra {
		p := strings.Split(e, "|")
		_, _ = db.Exec(`INSERT INTO extras(id,name,price_per_day) VALUES(lower(hex(randomblob(16))),?,?)`, p[0], p[1])
	}
	_, _ = db.Exec(`INSERT INTO cars(id,brand,model,year,category,transmission,fuel,seats,daily_price,status,mileage,description,images) VALUES
	(lower(hex(randomblob(16))),'Toyota','Corolla',2022,'sedan','automatic','gasoline',5,55,'available',32000,'Reliable city sedan','["https://images.unsplash.com/photo-1494976388531-d1058494cdd8"]'),
	(lower(hex(randomblob(16))),'BMW','X5',2023,'suv','automatic','diesel',5,120,'available',12000,'Premium SUV','["https://images.unsplash.com/photo-1555215695-3004980ad54e"]')`)
	return nil
}

func main() {
	db, err := sql.Open("sqlite3", env("DATABASE_URL", "./rentacar.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := runMigrations(db); err != nil {
		log.Fatal(err)
	}
	if err := seedDev(db); err != nil {
		log.Fatal(err)
	}

	users := &repositories.UserRepository{DB: db}
	cars := &repositories.CarRepository{DB: db}
	extras := &repositories.ExtraRepository{DB: db}
	reservations := &repositories.ReservationRepository{DB: db}
	h := &handlers.Handler{Auth: &services.AuthService{Users: users, JWTSecret: env("JWT_SECRET", "supersecret")}, Cars: cars, Extras: extras, Reservations: reservations, ReservationService: &services.ReservationService{Cars: cars, Reservations: reservations, Extras: extras}}

	r := gin.Default()
	r.Use(cors.New(cors.Config{AllowOrigins: []string{env("CORS_ORIGIN", "http://localhost:5173")}, AllowHeaders: []string{"Authorization", "Content-Type"}, AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}}))
	api := r.Group("/api")
	api.POST("/auth/register", h.Register)
	api.POST("/auth/login", h.Login)
	api.GET("/cars", h.ListCars)
	api.GET("/cars/:id", h.GetCar)
	api.GET("/extras", h.ListExtras)
	auth := api.Group("")
	auth.Use(middleware.AuthRequired(env("JWT_SECRET", "supersecret")))
	auth.GET("/auth/me", h.Me)
	auth.POST("/reservations", h.CreateReservation)
	auth.GET("/reservations/my", h.ListMyReservations)
	auth.PATCH("/reservations/:id/cancel", h.CancelReservation)
	admin := auth.Group("/admin")
	admin.Use(middleware.RequireRole("admin"))
	admin.POST("/cars", h.CreateCar)
	admin.PUT("/cars/:id", h.UpdateCar)
	admin.DELETE("/cars/:id", h.DeleteCar)
	admin.GET("/reservations", h.AdminListReservations)
	admin.PATCH("/reservations/:id/status", h.AdminUpdateReservationStatus)
	admin.GET("/dashboard", h.AdminDashboard)
	log.Fatal(r.Run(":" + env("PORT", "8080")))
}
