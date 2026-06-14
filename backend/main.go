package main

import (
    "barbershop-backend/database"
    "barbershop-backend/handlers"
    "barbershop-backend/middleware"
    "log"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
)

func main() {
    // Load .env file
    if err := godotenv.Load(); err != nil {
        log.Println("Warning: .env file not found, using system environment variables")
    }

    // Connect to Turso Database
    db := database.ConnectTurso()
    defer db.Close()

    // Setup Gin router
    r := gin.Default()
    
    // Add CORS middleware
    r.Use(middleware.CORS())

    // Health check endpoint
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status": "ok",
            "message": "Barbershop API is running",
        })
    })

    // API Routes group
    api := r.Group("/api")
    {
        // ============================================
        // PUBLIC ROUTES (No authentication required)
        // ============================================
        
        // Customer routes
        api.GET("/services", handlers.GetServices(db))
        api.GET("/barbers", handlers.GetBarbers(db))
        api.GET("/slots", handlers.GetAvailableSlots(db))
        api.POST("/booking", handlers.CreateBooking(db))
        
        // Owner authentication
        api.POST("/owner/login", handlers.OwnerLogin(db))

        // ============================================
        // PROTECTED ROUTES (Owner only - JWT required)
        // ============================================
        owner := api.Group("/owner")
        owner.Use(middleware.OwnerAuth())
        {
            // Booking management
            owner.GET("/bookings", handlers.GetAllBookings(db))
            owner.PUT("/booking/:id/status", handlers.UpdateBookingStatus(db))
            owner.DELETE("/booking/:id", handlers.DeleteBooking(db))
            owner.DELETE("/bookings/bulk", handlers.DeleteBookingsBulk(db))
            
            // Barber management
            owner.GET("/barbers/status", handlers.GetBarbersStatus(db))
            owner.GET("/barbers/schedule", handlers.GetBarberSchedule(db))
            owner.PUT("/barber/:id/schedule", handlers.UpdateBarberSchedule(db))
            owner.PUT("/barber/:id/availability", handlers.UpdateBarberAvailability(db))
        }
    }

    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("🚀 Barbershop API Server running on port %s", port)
    log.Printf("📋 Health check: http://localhost:%s/health", port)
    log.Printf("🔧 API endpoints: http://localhost:%s/api/...", port)
    
    if err := r.Run(":" + port); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}