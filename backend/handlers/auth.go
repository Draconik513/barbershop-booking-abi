package handlers

import (
	"database/sql"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func OwnerLogin(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username dan password wajib diisi"})
			return
		}

		expectedUsername := os.Getenv("OWNER_USERNAME")
		expectedPassword := os.Getenv("OWNER_PASSWORD")
		if expectedUsername == "" {
			expectedUsername = "owner"
		}
		if expectedPassword == "" {
			expectedPassword = "barbershop123"
		}

		if req.Username != expectedUsername || req.Password != expectedPassword {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Username atau password salah"})
			return
		}

		token := os.Getenv("OWNER_TOKEN")
		if token == "" {
			token = "rahasiaowner123"
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"token":   token,
			"message": "Login berhasil",
		})
	}
}
