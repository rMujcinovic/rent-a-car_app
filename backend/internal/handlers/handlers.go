package handlers

import (
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
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
	Reviews            *repositories.ReviewRepository
	Audit              *repositories.AuditLogRepository
	ReservationService *services.ReservationService
}

func bindAndValidate(c *gin.Context, req interface{}) bool {
	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return false
	}
	return true
}

func (h *Handler) syncCarAvailability(carID string) {
	blocking, err := h.Reservations.HasBlockingForCar(carID)
	if err != nil {
		return
	}
	car, err := h.Cars.GetByID(carID)
	if err != nil {
		return
	}
	if blocking {
		if car.Status != "rented" {
			_ = h.Cars.UpdateStatus(carID, "rented")
		}
		return
	}
	if car.Status == "rented" {
		_ = h.Cars.UpdateStatus(carID, "available")
	}
}

func (h *Handler) addAudit(c *gin.Context, action, entity, entityID, details string) {
	if h.Audit == nil {
		return
	}
	actorID := c.GetString("userId")
	actorName := c.GetString("username")
	if actorID == "" {
		actorID = "system"
	}
	if actorName == "" {
		actorName = "system"
	}
	_ = h.Audit.Create(actorID, actorName, action, entity, entityID, details)
}

func (h *Handler) Register(c *gin.Context) {
	var req struct{ Username, Password string }
	if !bindAndValidate(c, &req) || len(req.Username) < 3 || len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if err := h.Auth.Register(req.Username, req.Password); err != nil {
		if errors.Is(err, services.ErrUsernameExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "username already exists"})
			return
		}
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
	for _, k := range []string{"q", "brand", "model", "category", "transmission", "fuel", "status", "minPrice", "maxPrice", "minYear", "maxYear", "minMileage", "maxMileage", "seats"} {
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

func (h *Handler) CarAvailability(c *gin.Context) {
	carID := c.Param("id")
	items, err := h.Reservations.ListBlockedRangesByCar(carID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	ranges := make([]gin.H, 0, len(items))
	for _, it := range items {
		ranges = append(ranges, gin.H{
			"startDate": it.StartDate,
			"endDate":   it.EndDate,
			"status":    it.Status,
		})
	}
	c.JSON(200, gin.H{"items": ranges})
}

func (h *Handler) ListCarReviews(c *gin.Context) {
	carID := c.Param("id")
	if _, err := h.Cars.GetByID(carID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "car not found"})
		return
	}
	items, avg, total, err := h.Reviews.ListByCar(carID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"items":         items,
		"averageRating": avg,
		"totalReviews":  total,
	})
}

func (h *Handler) CreateCarReview(c *gin.Context) {
	carID := c.Param("id")
	if _, err := h.Cars.GetByID(carID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "car not found"})
		return
	}
	var req struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if !bindAndValidate(c, &req) {
		return
	}
	if req.Rating < 1 || req.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be between 1 and 5"})
		return
	}
	userID := c.GetString("userId")
	err := h.Reviews.Create(carID, userID, req.Rating, strings.TrimSpace(req.Comment))
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique constraint failed") {
			c.JSON(http.StatusConflict, gin.H{"error": "you already reviewed this car"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.addAudit(c, "create", "review", carID, fmt.Sprintf("rating=%d", req.Rating))
	c.JSON(http.StatusCreated, gin.H{"message": "review created"})
}

func imageExtFromMime(mime string) string {
	switch strings.ToLower(strings.TrimSpace(mime)) {
	case "image/jpeg", "image/jpg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	default:
		return ".jpg"
	}
}

func normalizeCarEnumFields(car *models.Car) {
	car.Category = strings.ToLower(strings.TrimSpace(car.Category))
	car.Transmission = strings.ToLower(strings.TrimSpace(car.Transmission))
	car.Fuel = strings.ToLower(strings.TrimSpace(car.Fuel))
	car.Status = strings.ToLower(strings.TrimSpace(car.Status))
}

func validateCarInput(car *models.Car) string {
	if strings.TrimSpace(car.Brand) == "" {
		return "brand is required"
	}
	if strings.TrimSpace(car.Model) == "" {
		return "model is required"
	}
	if strings.TrimSpace(car.Category) == "" {
		return "category is required"
	}
	if strings.TrimSpace(car.Transmission) == "" {
		return "transmission is required"
	}
	if strings.TrimSpace(car.Fuel) == "" {
		return "fuel is required"
	}
	if car.Year < 1900 {
		return "year is invalid"
	}
	if car.Seats < 1 {
		return "seats must be at least 1"
	}
	if car.DailyPrice <= 0 {
		return "dailyPrice must be greater than 0"
	}
	if car.Mileage < 0 {
		return "mileage must be >= 0"
	}
	allowedStatus := map[string]bool{"available": true, "rented": true, "maintenance": true}
	if !allowedStatus[car.Status] {
		return "status is invalid"
	}
	return ""
}

func (h *Handler) normalizeImageRefs(c *gin.Context, refs []string) ([]string, error) {
	out := make([]string, 0, len(refs))
	for i, ref := range refs {
		ref = strings.TrimSpace(ref)
		if ref == "" {
			continue
		}
		if !strings.HasPrefix(ref, "data:image/") {
			out = append(out, ref)
			continue
		}

		parts := strings.SplitN(ref, ",", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid data image format")
		}
		meta, payload := parts[0], parts[1]
		if !strings.Contains(meta, ";base64") {
			return nil, fmt.Errorf("only base64 data images are supported")
		}

		mime := strings.TrimPrefix(strings.SplitN(meta, ";", 2)[0], "data:")
		raw, err := base64.StdEncoding.DecodeString(payload)
		if err != nil {
			return nil, fmt.Errorf("invalid base64 image data")
		}

		name := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), i, imageExtFromMime(mime))
		dst := filepath.Join("uploads", name)
		if err := os.WriteFile(dst, raw, 0o644); err != nil {
			return nil, fmt.Errorf("failed to persist uploaded image")
		}
		out = append(out, "/uploads/"+name)
	}
	return out, nil
}

func (h *Handler) AdminUploadImages(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil || form == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
		return
	}
	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files provided"})
		return
	}

	items := make([]string, 0, len(files))
	for i, f := range files {
		ct := strings.ToLower(f.Header.Get("Content-Type"))
		if !strings.HasPrefix(ct, "image/") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "only image files are allowed"})
			return
		}
		ext := strings.ToLower(filepath.Ext(f.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		name := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), i, ext)
		dst := filepath.Join("uploads", name)
		if err := c.SaveUploadedFile(f, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}
		items = append(items, "/uploads/"+name)
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}
func (h *Handler) CreateCar(c *gin.Context) {
	var car models.Car
	if !bindAndValidate(c, &car) {
		return
	}
	normalizeCarEnumFields(&car)
	if car.Status == "" {
		car.Status = "available"
	}
	if msg := validateCarInput(&car); msg != "" {
		c.JSON(400, gin.H{"error": msg})
		return
	}
	normalized, err := h.normalizeImageRefs(c, car.Images)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	car.Images = normalized
	if err := h.Cars.Create(&car); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	h.addAudit(c, "create", "car", car.ID, fmt.Sprintf("%s %s", car.Brand, car.Model))
	c.JSON(201, car)
}
func (h *Handler) UpdateCar(c *gin.Context) {
	var car models.Car
	if !bindAndValidate(c, &car) {
		return
	}
	normalizeCarEnumFields(&car)
	if msg := validateCarInput(&car); msg != "" {
		c.JSON(400, gin.H{"error": msg})
		return
	}
	normalized, err := h.normalizeImageRefs(c, car.Images)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	car.Images = normalized
	if err := h.Cars.Update(c.Param("id"), &car); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	h.addAudit(c, "update", "car", c.Param("id"), fmt.Sprintf("%s %s", car.Brand, car.Model))
	c.JSON(200, gin.H{"message": "updated"})
}
func (h *Handler) DeleteCar(c *gin.Context) {
	if err := h.Cars.Delete(c.Param("id")); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	h.addAudit(c, "delete", "car", c.Param("id"), "")
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
	h.syncCarAvailability(req.CarID)
	h.addAudit(c, "create", "reservation", res.ID, req.CarID)
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
	h.syncCarAvailability(re.CarID)
	h.addAudit(c, "cancel", "reservation", re.ID, "user cancelled reservation")
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
	re, err := h.Reservations.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(404, gin.H{"error": "not found"})
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
	h.syncCarAvailability(re.CarID)
	h.addAudit(c, "status_change", "reservation", re.ID, req.Status)
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
	logs := []models.AuditLog{}
	if h.Audit != nil {
		logs, _ = h.Audit.ListRecent(20)
	}
	c.JSON(200, gin.H{"metrics": m, "recent": recent, "auditLogs": logs})
}

func (h *Handler) AdminAuditLogs(c *gin.Context) {
	if h.Audit == nil {
		c.JSON(200, []models.AuditLog{})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	items, err := h.Audit.ListRecent(limit)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, items)
}
