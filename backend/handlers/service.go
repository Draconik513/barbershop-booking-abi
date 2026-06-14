package handlers

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
)

func GetServices(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        rows, err := db.Query(`
            SELECT id, name, duration, price, description, icon 
            FROM services ORDER BY price ASC`)

        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
            return
        }
        defer rows.Close()

        var services []gin.H
        for rows.Next() {
            var id, name, description, icon string
            var duration, price int

            rows.Scan(&id, &name, &duration, &price, &description, &icon)

            services = append(services, gin.H{
                "id":          id,
                "name":        name,
                "duration":    duration,
                "price":       price,
                "description": description,
                "icon":        icon,
            })
        }

        c.JSON(http.StatusOK, services)
    }
}