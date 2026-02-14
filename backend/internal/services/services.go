package services

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"rentacar/backend/internal/auth"
	"rentacar/backend/internal/models"
	"rentacar/backend/internal/repositories"
)

type AuthService struct {
	Users     *repositories.UserRepository
	JWTSecret string
}

func (s *AuthService) Register(username, password string) error {
	if _, err := s.Users.FindByUsername(username); err == nil {
		return errors.New("username already exists")
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	_, err := s.Users.Create(username, string(hash), "user")
	return err
}
func (s *AuthService) Login(username, password string) (string, *models.User, error) {
	u, err := s.Users.FindByUsername(username)
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}
	if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)) != nil {
		return "", nil, errors.New("invalid credentials")
	}
	t, err := auth.GenerateToken(s.JWTSecret, u.ID, u.Username, u.Role)
	return t, u, err
}

type ReservationService struct {
	Cars         *repositories.CarRepository
	Reservations *repositories.ReservationRepository
	Extras       *repositories.ExtraRepository
}

func (s *ReservationService) Create(res *models.Reservation, extraIDs []string) error {
	if !res.EndDate.After(res.StartDate) {
		return errors.New("endDate must be greater than startDate")
	}
	if _, err := s.Cars.GetByID(res.CarID); err != nil {
		return errors.New("car not found")
	}
	overlap, err := s.Reservations.HasOverlap(res.CarID, res.StartDate, res.EndDate)
	if err != nil {
		return err
	}
	if overlap {
		return errors.New("car already reserved for selected dates")
	}
	extras, err := s.Extras.ByIDs(extraIDs)
	if err != nil {
		return err
	}
	days := int(res.EndDate.Sub(res.StartDate).Hours() / 24)
	if days < 1 {
		days = 1
	}
	car, _ := s.Cars.GetByID(res.CarID)
	extraDaily := 0.0
	for _, e := range extras {
		extraDaily += e.PricePerDay
	}
	res.TotalPrice = float64(days) * (car.DailyPrice + extraDaily)
	res.Status = "pending"
	return s.Reservations.Create(res, extraIDs)
}
func CanCancel(res *models.Reservation) bool {
	return time.Now().UTC().Before(res.StartDate) && (res.Status == "pending" || res.Status == "approved")
}

func IsNotFound(err error) bool { return errors.Is(err, sql.ErrNoRows) }
