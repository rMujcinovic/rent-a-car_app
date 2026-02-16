package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

type Car struct {
	ID           string    `json:"id"`
	Brand        string    `json:"brand"`
	Model        string    `json:"model"`
	Year         int       `json:"year"`
	Category     string    `json:"category"`
	Transmission string    `json:"transmission"`
	Fuel         string    `json:"fuel"`
	Seats        int       `json:"seats"`
	DailyPrice   float64   `json:"dailyPrice"`
	Status       string    `json:"status"`
	Mileage      int       `json:"mileage"`
	Description  string    `json:"description"`
	Images       []string  `json:"images"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Extra struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	PricePerDay float64 `json:"pricePerDay"`
}

type Reservation struct {
	ID              string    `json:"id"`
	CarID           string    `json:"carId"`
	UserID          string    `json:"userId"`
	StartDate       time.Time `json:"startDate"`
	EndDate         time.Time `json:"endDate"`
	PickupLocation  string    `json:"pickupLocation"`
	DropoffLocation string    `json:"dropoffLocation"`
	Notes           string    `json:"notes"`
	Status          string    `json:"status"`
	TotalPrice      float64   `json:"totalPrice"`
	CreatedAt       time.Time `json:"createdAt"`
	Extras          []Extra   `json:"extras,omitempty"`
	Car             *Car      `json:"car,omitempty"`
	Username        string    `json:"username,omitempty"`
}

type AuditLog struct {
	ID        string    `json:"id"`
	ActorID   string    `json:"actorId"`
	ActorName string    `json:"actorName"`
	Action    string    `json:"action"`
	Entity    string    `json:"entity"`
	EntityID  string    `json:"entityId"`
	Details   string    `json:"details"`
	CreatedAt time.Time `json:"createdAt"`
}

type Review struct {
	ID        string    `json:"id"`
	CarID     string    `json:"carId"`
	UserID    string    `json:"userId"`
	Username  string    `json:"username"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"createdAt"`
}
