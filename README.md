# 💈 BarberBook — Barbershop Booking System

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2?style=for-the-badge&logo=sqlite&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack barbershop appointment booking system built with React + Golang + Turso.**  
Clean UI, real-time slot availability, WhatsApp integration, and a protected owner dashboard.

</div>

---

## ✨ Features

### 👤 Customer Side
- Browse available **services** with price & duration
- View **barbers** with ratings and working hours
- Pick available **date & time slots** (30-min intervals, auto-refreshed)
- Book appointment **without login**
- Auto-redirect to **WhatsApp** to confirm booking with owner
- Real-time slot status: `Available` / `Booked` / `✓ Completed`

### 🔐 Owner Dashboard
- Secure login (JWT-based token auth)
- **Booking stats** — total, pending, completed at a glance
- **Update booking status** — mark as completed or cancelled
- **Delete bookings** — single or bulk cleanup
- **Barber status** — available / busy / off duty
- **WhatsApp shortcut** to contact customers directly
- Fully **responsive** on mobile & desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Golang + Gin Framework |
| Database | Turso (libSQL edge database) |
| Auth | Token-based (stored in localStorage) |
| Integration | WhatsApp API (wa.me deep link) |

---

## 🏗️ Project Structure

```
barbershop-booking/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── .env.example
│   ├── database/
│   │   └── turso.go         # DB connection & seed data
│   ├── handlers/
│   │   ├── auth.go          # Owner login
│   │   ├── booking.go       # Create & manage bookings
│   │   ├── barber.go        # Barbers & time slots
│   │   └── service.go       # Services list
│   └── middleware/
│       ├── auth.go          # Token validation
│       └── cors.go          # CORS config
└── frontend/
    └── src/
        ├── pages/
        │   ├── CustomerBooking.jsx
        │   ├── OwnerDashboard.jsx
        │   └── OwnerLogin.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ServiceCard.jsx
        │   ├── BarberCard.jsx
        │   └── TimeSlot.jsx
        └── api/
            └── client.js
```

---

## 🚀 Quick Start

### Prerequisites
- [Go 1.21+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Turso account](https://turso.tech/) (free tier: 500 databases)

### 1. Clone Repository
```bash
git clone https://github.com/draconik514/barbershop-booking.git
cd barbershop-booking
```

### 2. Setup Turso Database
```bash
# Install Turso CLI
winget install turso

# Login & create database
turso auth login
turso db create barbershop-db

# Get credentials
turso db show barbershop-db --url
turso db tokens create barbershop-db
```

### 3. Setup Backend
```bash
cd backend

# Copy env example
cp .env.example .env
# Edit .env with your Turso credentials

# Install dependencies & run
go mod tidy
go run main.go
```

### 4. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open in Browser

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Customer booking page |
| `http://localhost:5173/owner/login` | Owner dashboard login |

> Default credentials: **username:** `owner` / **password:** `barbershop123`

---

## 📊 API Endpoints

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | Get all services |
| `GET` | `/api/barbers` | Get available barbers |
| `GET` | `/api/slots` | Get time slots by barber & date |
| `POST` | `/api/booking` | Create new booking |
| `POST` | `/api/owner/login` | Owner authentication |

### Protected (Bearer Token Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/owner/bookings` | Get all bookings |
| `PUT` | `/api/owner/booking/:id/status` | Update booking status |
| `DELETE` | `/api/owner/booking/:id` | Delete single booking |
| `DELETE` | `/api/owner/bookings/bulk` | Bulk delete bookings |
| `GET` | `/api/owner/barbers/status` | Get barbers status |
| `PUT` | `/api/owner/barber/:id/schedule` | Update barber schedule |

---

## 🔒 Environment Variables

Create `backend/.env` based on this example:

```env
# Turso Database
TURSO_URL=libsql://your-database.turso.io
TURSO_TOKEN=your_turso_token_here

# Server
PORT=8080

# Owner Credentials
OWNER_USERNAME=owner
OWNER_PASSWORD=your_password_here
OWNER_TOKEN=your_secret_token_here
```

---

## 📈 Business Value

This system solves real problems for barbershop owners:

| Problem | Solution |
|---------|----------|
| Phone bookings are chaotic | Online self-booking by customers |
| Double booking issues | Real-time slot locking |
| No-shows | WhatsApp confirmation flow |
| Manual record keeping | Digital booking history with status tracking |
| Schedule visibility | Live barber availability dashboard |

---

## 🗂️ Database Schema

```sql
-- Services
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT, duration INTEGER, price INTEGER,
  description TEXT, icon TEXT
);

-- Barbers
CREATE TABLE barbers (
  id TEXT PRIMARY KEY,
  name TEXT, avatar TEXT, rating REAL,
  total_bookings INTEGER, start_time TEXT,
  end_time TEXT, is_available BOOLEAN
);

-- Bookings
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  booking_code TEXT UNIQUE,
  customer_name TEXT, customer_phone TEXT,
  service_id TEXT, barber_id TEXT,
  booking_date TEXT, time_slot TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT
);
```

---

## 👨‍💻 Author

**Draconik**  
[![GitHub](https://img.shields.io/badge/GitHub-draconik514-181717?style=flat&logo=github)](https://github.com/draconik514)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use for personal or commercial projects.

---

<div align="center">
  <sub>Built with ❤️ for barbershop business owners</sub>
</div>
