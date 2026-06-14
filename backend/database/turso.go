package database

import (
    "database/sql"
    "log"
    "os"

    _ "github.com/tursodatabase/libsql-client-go/libsql"
)

func ConnectTurso() *sql.DB {
    url := os.Getenv("TURSO_URL")
    token := os.Getenv("TURSO_TOKEN")

    if url == "" || token == "" {
        log.Fatal("TURSO_URL and TURSO_TOKEN must be set")
    }

    db, err := sql.Open("libsql", url+"?authToken="+token)
    if err != nil {
        log.Fatal("Failed to connect to Turso:", err)
    }

    // Create tables
    createTables(db)

    // Run migrations
    migrateTables(db)

    // Seed initial data
    seedData(db)

    return db
}

func createTables(db *sql.DB) {
    queries := []string{
        `CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            duration INTEGER NOT NULL,
            price INTEGER NOT NULL,
            description TEXT,
            icon TEXT
        )`,

        `CREATE TABLE IF NOT EXISTS barbers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            avatar TEXT,
            rating REAL DEFAULT 0,
            total_bookings INTEGER DEFAULT 0,
            start_time TEXT DEFAULT '09:00',
            end_time TEXT DEFAULT '17:00',
            is_available BOOLEAN DEFAULT 1
        )`,

        `CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            booking_code TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            service_id TEXT NOT NULL,
            barber_id TEXT NOT NULL,
            booking_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(service_id) REFERENCES services(id),
            FOREIGN KEY(barber_id) REFERENCES barbers(id)
        )`,

        `CREATE TABLE IF NOT EXISTS barber_schedules (
            id TEXT PRIMARY KEY,
            barber_id TEXT NOT NULL,
            day_of_week INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            FOREIGN KEY(barber_id) REFERENCES barbers(id)
        )`,
    }

    for _, q := range queries {
        _, err := db.Exec(q)
        if err != nil {
            log.Printf("Error creating table: %v", err)
        }
    }
}

func migrateTables(db *sql.DB) {
    migrations := []string{
        `ALTER TABLE barbers ADD COLUMN is_available BOOLEAN DEFAULT 1`,
        `ALTER TABLE barbers ADD COLUMN status_note TEXT DEFAULT ''`,
    }
    for _, m := range migrations {
        db.Exec(m) // ignore error if column already exists
    }
}

func seedData(db *sql.DB) {
    // Check if services exist
    var count int
    db.QueryRow("SELECT COUNT(*) FROM services").Scan(&count)
    if count > 0 {
        return
    }

    // Insert sample services
    services := []string{
        `INSERT INTO services VALUES 
            ('s1', 'Haircut Classic', 30, 50000, 'Potong rambut dengan gaya klasik', 'scissors')`,
        `INSERT INTO services VALUES 
            ('s2', 'Shave Premium', 20, 35000, 'Cukur jenggot dan rapiin style', 'razor')`,
        `INSERT INTO services VALUES 
            ('s3', 'Hair Color', 90, 150000, 'Warnai rambut dengan warna pilihan', 'palette')`,
        `INSERT INTO services VALUES 
            ('s4', 'Beard Styling', 25, 40000, 'Styling jenggot profesional', 'beard')`,
        `INSERT INTO services VALUES 
            ('s5', 'Hair Spa', 45, 80000, 'Perawatan rambut dan kulit kepala', 'spa')`,
    }

    for _, s := range services {
        db.Exec(s)
    }

    // Insert sample barbers
    barbers := []string{
        `INSERT INTO barbers (id, name, avatar, rating, total_bookings, start_time, end_time, is_available) VALUES 
            ('b1', 'Bang Jago', '/avatars/barber1.jpg', 4.8, 0, '09:00', '17:00', 1)`,
        `INSERT INTO barbers (id, name, avatar, rating, total_bookings, start_time, end_time, is_available) VALUES 
            ('b2', 'Mas Randy', '/avatars/barber2.jpg', 4.9, 0, '10:00', '19:00', 1)`,
        `INSERT INTO barbers (id, name, avatar, rating, total_bookings, start_time, end_time, is_available) VALUES 
            ('b3', 'Kak Alex', '/avatars/barber3.jpg', 4.7, 0, '08:00', '16:00', 1)`,
    }

    for _, b := range barbers {
        db.Exec(b)
    }
}