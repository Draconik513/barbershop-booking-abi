package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type BookingRequest struct {
	CustomerName  string `json:"customer_name" binding:"required"`
	CustomerPhone string `json:"customer_phone" binding:"required"`
	ServiceID     string `json:"service_id" binding:"required"`
	BarberID      string `json:"barber_id" binding:"required"`
	BookingDate   string `json:"booking_date" binding:"required"`
	TimeSlot      string `json:"time_slot" binding:"required"`
}

func CreateBooking(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req BookingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var count int
		db.QueryRow(`
			SELECT COUNT(*) FROM bookings 
			WHERE barber_id = ? AND booking_date = ? AND time_slot = ? 
			AND status != 'cancelled'`,
			req.BarberID, req.BookingDate, req.TimeSlot,
		).Scan(&count)

		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Slot already booked"})
			return
		}

		code := generateBookingCode()
		id := generateID()
		now := time.Now().Format(time.RFC3339)

		_, err := db.Exec(`
			INSERT INTO bookings (id, booking_code, customer_name, customer_phone, 
			service_id, barber_id, booking_date, time_slot, status, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
			id, code, req.CustomerName, req.CustomerPhone,
			req.ServiceID, req.BarberID, req.BookingDate, req.TimeSlot, now,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create booking"})
			return
		}

		db.Exec(`UPDATE barbers SET total_bookings = total_bookings + 1 WHERE id = ?`, req.BarberID)

		waLink := generateWhatsAppLink(req, code)

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"booking_code":  code,
			"whatsapp_link": waLink,
			"message":       "Booking berhasil! Klik WhatsApp untuk konfirmasi ke owner.",
		})
	}
}

func generateWhatsAppLink(req BookingRequest, code string) string {
	ownerPhone := "6282293845447" // <== GANTI dengan nomor WhatsApp owner

	message := "Halo%20Admin%2C%0A%0A" +
		"Saya%20" + req.CustomerName + "%20telah%20melakukan%20booking%20dengan%20detail%3A%0A%0A" +
		"%F0%9F%93%8B%20*Kode%20Booking*%3A%20" + code + "%0A" +
		"%F0%9F%93%9E%20*No.%20Customer*%3A%20" + req.CustomerPhone + "%0A" +
		"%F0%9F%92%88%20*Layanan*%3A%20" + req.ServiceID + "%0A" +
		"%F0%9F%91%A4%20*Barber*%3A%20" + req.BarberID + "%0A" +
		"%F0%9F%93%85%20*Tanggal*%3A%20" + req.BookingDate + "%0A" +
		"%E2%8F%B0%20*Jam*%3A%20" + req.TimeSlot + "%0A%0A" +
		"Mohon%20dikonfirmasi%20bookingnya%20ya%2C%20Admin.%0A" +
		"Terima%20kasih%20%F0%9F%99%8F"

	return "https://wa.me/" + ownerPhone + "?text=" + message
}

func DeleteBooking(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		_, err := db.Exec(`DELETE FROM bookings WHERE id = ?`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus booking"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Booking berhasil dihapus"})
	}
}

func DeleteBookingsBulk(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		statusFilter := c.Query("status") // ?status=completed atau ?status=cancelled atau kosong = semua

		var err error
		if statusFilter == "" {
			_, err = db.Exec(`DELETE FROM bookings WHERE status IN ('completed', 'cancelled')`)
		} else {
			_, err = db.Exec(`DELETE FROM bookings WHERE status = ?`, statusFilter)
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus riwayat"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Riwayat berhasil dibersihkan"})
	}
}

func generateBookingCode() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return strings.ToUpper("BRB-" + hex.EncodeToString(bytes)[:8])
}

func generateID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
