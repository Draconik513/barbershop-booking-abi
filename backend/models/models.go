package models

import "time"

type Service struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Duration    int    `json:"duration"`
    Price       int    `json:"price"`
    Description string `json:"description"`
    Icon        string `json:"icon"`
}

type Barber struct {
    ID            string  `json:"id"`
    Name          string  `json:"name"`
    Avatar        string  `json:"avatar"`
    Rating        float64 `json:"rating"`
    TotalBookings int     `json:"total_bookings"`
    StartTime     string  `json:"start_time"`
    EndTime       string  `json:"end_time"`
}

type Booking struct {
    ID           string    `json:"id"`
    BookingCode  string    `json:"booking_code"`
    CustomerName string    `json:"customer_name"`
    CustomerPhone string   `json:"customer_phone"`
    ServiceID    string    `json:"service_id"`
    BarberID     string    `json:"barber_id"`
    BookingDate  string    `json:"booking_date"`
    TimeSlot     string    `json:"time_slot"`
    Status       string    `json:"status"`
    CreatedAt    time.Time `json:"created_at"`
}

type BarberSchedule struct {
    ID          string `json:"id"`
    BarberID    string `json:"barber_id"`
    DayOfWeek   int    `json:"day_of_week"`
    StartTime   string `json:"start_time"`
    EndTime     string `json:"end_time"`
    IsAvailable bool   `json:"is_available"`
}

type TimeSlot struct {
    Time      string `json:"time"`
    Available bool   `json:"available"`
}