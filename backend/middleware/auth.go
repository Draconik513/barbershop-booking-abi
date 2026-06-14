package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func OwnerAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")

		expectedToken := os.Getenv("OWNER_TOKEN")
		if expectedToken == "" {
			expectedToken = "rahasiaowner123"
		}

		if token == "" || token != expectedToken {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Next()
	}
}
