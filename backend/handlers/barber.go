package handlers

import (
    "database/sql"
    "log"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
)

func GetBarbers(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        rows, err := db.Query(`
            SELECT b.id, b.name, b.avatar, b.rating, b.start_time, b.end_time, b.is_available, b.status_note,
                   COUNT(CASE WHEN bk.booking_date = date('now') AND bk.status != 'cancelled' THEN 1 END) as today_bookings
            FROM barbers b
            LEFT JOIN bookings bk ON b.id = bk.barber_id
            GROUP BY b.id
            ORDER BY b.rating DESC`)

        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
            return
        }
        defer rows.Close()

        var barbers []gin.H
        for rows.Next() {
            var id, name, avatar, startTime, endTime, statusNote string
            var rating float64
            var todayBookings int
            var isAvailable bool

            rows.Scan(&id, &name, &avatar, &rating, &startTime, &endTime, &isAvailable, &statusNote, &todayBookings)

            barbers = append(barbers, gin.H{
                "id":             id,
                "name":           name,
                "avatar":         avatar,
                "rating":         rating,
                "today_bookings": todayBookings,
                "start_time":     startTime,
                "end_time":       endTime,
                "is_available":   isAvailable,
                "status_note":    statusNote,
            })
        }

        c.JSON(http.StatusOK, barbers)
    }
}

func GetAvailableSlots(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        barberID := c.Query("barber_id")
        date := c.Query("date")

        if barberID == "" || date == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "barber_id and date required"})
            return
        }

        // Get barber working hours
        var startTime, endTime string
        db.QueryRow(`
            SELECT start_time, end_time FROM barbers WHERE id = ?`, barberID,
        ).Scan(&startTime, &endTime)

        // Generate 30-min slots
        var slots []string
        start, _ := time.Parse("15:04", startTime)
        end, _ := time.Parse("15:04", endTime)

        for t := start; t.Before(end); t = t.Add(30 * time.Minute) {
            slot := t.Format("15:04")
            slots = append(slots, slot)
        }

        // Get booked slots
        rows, err := db.Query(`
            SELECT time_slot, status FROM bookings 
            WHERE barber_id = ? AND booking_date = ? AND status != 'cancelled'`,
            barberID, date)
        if err != nil {
            c.JSON(http.StatusOK, slots)
            return
        }
        defer rows.Close()

        bookedSlots := make(map[string]string)
        for rows.Next() {
            var timeSlot, status string
            if err := rows.Scan(&timeSlot, &status); err != nil {
                log.Printf("Error scanning slot: %v", err)
                continue
            }
            bookedSlots[timeSlot] = status
        }

        log.Printf("Booked slots for barber %s on %s: %+v", barberID, date, bookedSlots)

        var availableSlots []gin.H
        for _, slot := range slots {
            if status, exists := bookedSlots[slot]; exists {
                availableSlots = append(availableSlots, gin.H{
                    "time":      slot,
                    "available": false,
                    "status":    status,
                })
            } else {
                availableSlots = append(availableSlots, gin.H{
                    "time":      slot,
                    "available": true,
                    "status":    "available",
                })
            }
        }

        c.JSON(http.StatusOK, availableSlots)
    }
}

func GetBarbersStatus(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        rows, err := db.Query(`
            SELECT b.id, b.name, b.is_available, b.status_note,
                   COUNT(CASE WHEN bk.status = 'pending' THEN 1 END) as today_bookings
            FROM barbers b
            LEFT JOIN bookings bk ON b.id = bk.barber_id AND bk.booking_date = date('now')
            GROUP BY b.id`)

        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
            return
        }
        defer rows.Close()

        var barbers []gin.H
        for rows.Next() {
            var id, name, statusNote string
            var isAvailable bool
            var todayBookings int
            rows.Scan(&id, &name, &isAvailable, &statusNote, &todayBookings)

            status := "available"
            if !isAvailable {
                status = "off"
            } else if todayBookings >= 8 {
                status = "busy"
            }

            barbers = append(barbers, gin.H{
                "id":             id,
                "name":           name,
                "status":         status,
                "status_note":    statusNote,
                "today_bookings": todayBookings,
                "is_available":   isAvailable,
            })
        }

        c.JSON(http.StatusOK, barbers)
    }
}
 
func UpdateBookingStatus(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        id := c.Param("id")
        var req struct {
            Status string `json:"status"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
            return
        }

        // Validasi status
        validStatus := map[string]bool{
            "pending":   true,
            "completed": true,
            "cancelled": true,
        }
        if !validStatus[req.Status] {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
            return
        }

        result, err := db.Exec(`UPDATE bookings SET status = ? WHERE id = ?`, req.Status, id)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
            return
        }

        rowsAffected, _ := result.RowsAffected()
        if rowsAffected == 0 {
            c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "success": true,
            "message": "Status berhasil diupdate",
            "status":  req.Status,
        })
    }
}

func GetAllBookings(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        rows, err := db.Query(`
            SELECT b.id, b.booking_code, b.customer_name, b.customer_phone,
                   s.name as service_name, br.name as barber_name,
                   b.booking_date, b.time_slot, b.status
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN barbers br ON b.barber_id = br.id
            ORDER BY b.booking_date DESC, b.time_slot ASC`)

        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
            return
        }
        defer rows.Close()

        var bookings []gin.H
        for rows.Next() {
            var id, code, customerName, customerPhone, serviceName, barberName, date, timeSlot, status string
            rows.Scan(&id, &code, &customerName, &customerPhone, &serviceName, &barberName, &date, &timeSlot, &status)

            bookings = append(bookings, gin.H{
                "id":              id,
                "booking_code":    code,
                "customer_name":   customerName,
                "customer_phone":  customerPhone,
                "service_name":    serviceName,
                "barber_name":     barberName,
                "booking_date":    date,
                "time_slot":       timeSlot,
                "status":          status,
            })
        }

        c.JSON(http.StatusOK, bookings)
    }
}

func UpdateBarberSchedule(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        id := c.Param("id")
        var req struct {
            StartTime string `json:"start_time"`
            EndTime   string `json:"end_time"`
        }
        c.ShouldBindJSON(&req)

        _, err := db.Exec(`UPDATE barbers SET start_time = ?, end_time = ? WHERE id = ?`,
            req.StartTime, req.EndTime, id)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"success": true})
    }
}

func UpdateBarberAvailability(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        id := c.Param("id")
        var req struct {
            IsAvailable bool   `json:"is_available"`
            StatusNote  string `json:"status_note"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
            return
        }

        _, err := db.Exec(`UPDATE barbers SET is_available = ?, status_note = ? WHERE id = ?`,
            req.IsAvailable, req.StatusNote, id)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"success": true})
    }
}

func GetBarberSchedule(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get all barbers
        barberRows, err := db.Query(`SELECT id, name FROM barbers ORDER BY name`)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
            return
        }
        defer barberRows.Close()

        type BarberInfo struct {
            ID   string
            Name string
        }
        var barbers []BarberInfo
        for barberRows.Next() {
            var b BarberInfo
            barberRows.Scan(&b.ID, &b.Name)
            barbers = append(barbers, b)
        }

        // Get bookings from today until end of next week
        bookingRows, err := db.Query(`
            SELECT bk.barber_id, bk.booking_date, bk.time_slot, bk.status,
                   bk.customer_name, s.name as service_name
            FROM bookings bk
            JOIN services s ON bk.service_id = s.id
            WHERE bk.booking_date >= date('now')
              AND bk.booking_date <= date('now', '+14 days')
              AND bk.status != 'cancelled'
            ORDER BY bk.booking_date ASC, bk.time_slot ASC`)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
            return
        }
        defer bookingRows.Close()

        type BookingItem struct {
            Date         string `json:"date"`
            TimeSlot     string `json:"time_slot"`
            Status       string `json:"status"`
            CustomerName string `json:"customer_name"`
            ServiceName  string `json:"service_name"`
        }
        bookingMap := make(map[string][]BookingItem)
        for bookingRows.Next() {
            var barberID string
            var item BookingItem
            bookingRows.Scan(&barberID, &item.Date, &item.TimeSlot, &item.Status, &item.CustomerName, &item.ServiceName)
            bookingMap[barberID] = append(bookingMap[barberID], item)
        }

        var result []gin.H
        for _, b := range barbers {
            items := bookingMap[b.ID]
            if items == nil {
                items = []BookingItem{}
            }
            todayCount := 0
            for _, item := range items {
                if item.Date == time.Now().Format("2006-01-02") {
                    todayCount++
                }
            }
            result = append(result, gin.H{
                "barber_id":     b.ID,
                "barber_name":   b.Name,
                "today_count":   todayCount,
                "bookings":      items,
            })
        }

        c.JSON(http.StatusOK, result)
    }
}
