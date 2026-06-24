package middleware

import (
    "os"
    "strings"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
    allowedOrigins := []string{
        "http://localhost:5173",
        "http://localhost:3000",
    }

    // Tambah FRONTEND_URL dari environment variable (diset di Railway)
    if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
        for _, url := range strings.Split(frontendURL, ",") {
            allowedOrigins = append(allowedOrigins, strings.TrimSpace(url))
        }
    }

    return cors.New(cors.Config{
        AllowOrigins:     allowedOrigins,
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    })
}