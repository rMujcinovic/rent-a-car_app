package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"rentacar/backend/internal/models"
	"rentacar/backend/internal/repositories"
	"rentacar/backend/internal/services"
)

type Handler struct {
	Auth               *services.AuthService
	Cars               *repositories.CarRepository
	Reservations       *repositories.ReservationRepository
	Extras             *repositories.ExtraRepository
	ReservationService *services.ReservationService
}

func bindAndValidate(c *gin.Context, req interface{}) bool {
	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return false
	}
	return true
}

func (h *Handler) Register(c *gin.Context) {
	var req struct{ Username, Password string }
	if !bindAndValidate(c, &req) || len(req.Username) < 3 || len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if err := h.Auth.Register(req.Username, req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "registered"})
}
func (h *Handler) Login(c *gin.Context) {
	var req struct{ Username, Password string }
	if !bindAndValidate(c, &req) {
		return
	}
	t, u, err := h.Auth.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": t, "user": u})
}
func (h *Handler) Me(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"user": gin.H{"id": c.GetString("userId"), "username": c.GetString("username"), "role": c.GetString("role")}})
}

func (h *Handler) ListCars(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 {
		limit = 10
	}
	filters := map[string]string{}
	for _, k := range []string{"q", "category", "transmission", "fuel", "status", "minPrice", "maxPrice", "minYear", "maxYear", "seats"} {
		filters[k] = c.Query(k)
	}
	cars, total, err := h.Cars.List(filters, limit, (page-1)*limit, c.DefaultQuery("sort", "newest"))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"items": cars, "total": total, "page": page, "limit": limit})
}
func (h *Handler) GetCar(c *gin.Context) {
	car, err := h.Cars.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, car)
}
func (h *Handler) CreateCar(c *gin.Context) {
	var car models.Car
	if !bindAndValidate(c, &car) {
		return
	}
	if car.Status == "" {
		car.Status = "available"
	}
	if err := h.Cars.Create(&car); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, car)
}
func (h *Handler) UpdateCar(c *gin.Context) {
	var car models.Car
	if !bindAndValidate(c, &car) {
		return
	}
	if err := h.Cars.Update(c.Param("id"), &car); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "updated"})
}
func (h *Handler) DeleteCar(c *gin.Context) {
	if err := h.Cars.Delete(c.Param("id")); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.Status(204)
}

func (h *Handler) ListExtras(c *gin.Context) {
	extras, err := h.Extras.List()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, extras)
}

func (h *Handler) CreateReservation(c *gin.Context) {
	var req struct {
		CarID, PickupLocation, DropoffLocation, Notes string
		StartDate, EndDate                            string
		ExtraIDs                                      []string `json:"extraIds"`
	}
	if !bindAndValidate(c, &req) {
		return
	}
	start, err1 := time.Parse("2006-01-02", req.StartDate)
	end, err2 := time.Parse("2006-01-02", req.EndDate)
	if err1 != nil || err2 != nil {
		c.JSON(400, gin.H{"error": "invalid dates"})
		return
	}
	res := &models.Reservation{CarID: req.CarID, UserID: c.GetString("userId"), StartDate: start.UTC(), EndDate: end.UTC(), PickupLocation: req.PickupLocation, DropoffLocation: req.DropoffLocation, Notes: req.Notes}
	if err := h.ReservationService.Create(res, req.ExtraIDs); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, res)
}
func (h *Handler) ListMyReservations(c *gin.Context) {
	items, err := h.Reservations.List(c.GetString("userId"), false)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	for i := range items {
		extras, _ := h.Reservations.ExtrasForReservation(items[i].ID)
		items[i].Extras = extras
	}
	c.JSON(200, items)
}
func (h *Handler) CancelReservation(c *gin.Context) {
	re, err := h.Reservations.GetByID(c.Param("id"))
	if err != nil || re.UserID != c.GetString("userId") {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	if !services.CanCancel(re) {
		c.JSON(400, gin.H{"error": "cannot cancel"})
		return
	}
	_ = h.Reservations.UpdateStatus(re.ID, "cancelled")
	c.JSON(200, gin.H{"message": "cancelled"})
}

func (h *Handler) AdminListReservations(c *gin.Context) {
	items, err := h.Reservations.List("", true)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	for i := range items {
		extras, _ := h.Reservations.ExtrasForReservation(items[i].ID)
		items[i].Extras = extras
	}
	c.JSON(200, items)
}
func (h *Handler) AdminUpdateReservationStatus(c *gin.Context) {
	var req struct {
		Status string `json:"status"`
	}
	if !bindAndValidate(c, &req) {
		return
	}
	allowed := map[string]bool{"approved": true, "denied": true, "active": true, "completed": true}
	if !allowed[req.Status] {
		c.JSON(400, gin.H{"error": "invalid status"})
		return
	}
	if err := h.Reservations.UpdateStatus(c.Param("id"), req.Status); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "not found"})
		} else {
			c.JSON(400, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(200, gin.H{"message": "updated"})
}
func (h *Handler) AdminDashboard(c *gin.Context) {
	m, err := h.Reservations.Metrics()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	recent, _ := h.Reservations.List("", true)
	if len(recent) > 10 {
		recent = recent[:10]
	}
	c.JSON(200, gin.H{"metrics": m, "recent": recent})
}
