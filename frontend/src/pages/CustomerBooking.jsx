import { useState, useEffect } from 'react'
import axios from 'axios'
import { format, addDays, addWeeks, startOfToday, isBefore } from 'date-fns'
import { id } from 'date-fns/locale'
import ServiceCard from '../components/ServiceCard'
import BarberCard from '../components/BarberCard'
import TimeSlot from '../components/TimeSlot'

const API_URL = 'http://localhost:8080/api'

function CustomerBooking() {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedBarber, setSelectedBarber] = useState(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)

  const today = startOfToday()

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(addWeeks(today, weekOffset), i)
    return {
      date: format(date, 'yyyy-MM-dd'),
      day: format(date, 'EEE', { locale: id }),
      dateNum: format(date, 'd'),
      month: format(date, 'MMM', { locale: id }),
      isPast: isBefore(date, today),
    }
  })

  useEffect(() => {
    axios.get(`${API_URL}/services`).then(r => setServices(r.data)).catch(console.error)
    axios.get(`${API_URL}/barbers`).then(r => setBarbers(r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedBarber) return
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/slots`, {
          params: { barber_id: selectedBarber.id, date: selectedDate }
        })
        setAvailableSlots(res.data)
        setSelectedSlot(null)
      } catch (err) { console.error(err) }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [selectedBarber, selectedDate])

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && selectedBarber) {
        axios.get(`${API_URL}/slots`, {
          params: { barber_id: selectedBarber.id, date: selectedDate }
        }).then(r => { setAvailableSlots(r.data); setSelectedSlot(null) }).catch(console.error)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [selectedBarber, selectedDate])

  const handleNextStep = () => {
    if (step === 1 && !selectedService) { alert('Silakan pilih layanan terlebih dahulu'); return }
    if (step === 2 && !selectedBarber) { alert('Silakan pilih barber terlebih dahulu'); return }
    if (step === 3 && (!selectedDate || !selectedSlot)) { alert('Silakan pilih tanggal dan jam'); return }
    setStep(step + 1)
  }

  const handleBooking = async () => {
    if (!customerName || !customerPhone) { alert('Mohon isi nama dan nomor WhatsApp'); return }
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/booking`, {
        customer_name: customerName,
        customer_phone: customerPhone,
        service_id: selectedService.id,
        barber_id: selectedBarber.id,
        booking_date: selectedDate,
        time_slot: selectedSlot.time,
      })
      setBookingResult(res.data)
      window.open(res.data.whatsapp_link, '_blank')
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Jam sudah dipesan, silakan pilih jam lain')
        axios.get(`${API_URL}/slots`, { params: { barber_id: selectedBarber.id, date: selectedDate } })
          .then(r => setAvailableSlots(r.data)).catch(console.error)
      } else {
        alert('Gagal booking, silakan coba lagi')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetBooking = () => {
    setBookingResult(null)
    setSelectedService(null)
    setSelectedBarber(null)
    setSelectedSlot(null)
    setCustomerName('')
    setCustomerPhone('')
    setStep(1)
    setWeekOffset(0)
  }

  const steps = [
    { id: 1, name: 'Pilih Layanan', icon: '✂️' },
    { id: 2, name: 'Pilih Barber', icon: '💈' },
    { id: 3, name: 'Pilih Jadwal', icon: '📅' },
    { id: 4, name: 'Data Diri', icon: '👤' },
  ]

  if (bookingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-primary mb-1">Booking Berhasil!</h2>
            <p className="text-sm text-text-light mb-5">{bookingResult.message}</p>
            <div className="bg-primary rounded-xl p-4 mb-5">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Kode Booking</p>
              <p className="text-2xl font-mono font-bold text-accent">{bookingResult.booking_code}</p>
            </div>
            <div className="space-y-2 text-left mb-5">
              {[
                ['Customer', customerName],
                ['Layanan', selectedService?.name],
                ['Barber', selectedBarber?.name],
                ['Tanggal', format(new Date(selectedDate), 'EEE, d MMM yyyy', { locale: id })],
                ['Jam', selectedSlot?.time ? `${selectedSlot.time} WIB` : '-'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-border text-sm">
                  <span className="text-text-light">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={resetBooking} className="btn-primary w-full">Booking Lagi</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Book Your Style</h1>
          <p className="text-sm text-text-light mt-1">Pilih layanan & jadwal favorit kamu</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 px-2">
          {steps.map((s, i) => (
            <>
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s.id ? 'bg-success text-white' : step === s.id ? 'bg-accent text-white shadow-md shadow-accent/30' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <p className={`text-xs mt-1.5 hidden sm:block ${
                  step === s.id ? 'text-accent font-semibold' : 'text-gray-400'
                }`}>{s.name}</p>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 mb-4 sm:mb-0 transition-all ${
                  step > s.id ? 'bg-success' : 'bg-gray-200'
                }`} />
              )}
            </>
          ))}
        </div>

        <div className="card">
        {step === 1 && (
          <div>
            <h2 className="section-title">✂️ Pilih Layanan</h2>
            <div className="space-y-3">
              {services.map(service => (
                <ServiceCard key={service.id} service={service} isSelected={selectedService?.id === service.id} onSelect={setSelectedService} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="section-title">💈 Pilih Barber</h2>
            <div className="space-y-3">
              {barbers.map(barber => (
                <BarberCard key={barber.id} barber={barber} isSelected={selectedBarber?.id === barber.id} onSelect={setSelectedBarber} />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="section-title">📅 Pilih Jadwal</h2>

            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                disabled={weekOffset === 0}
                className="px-4 py-2 rounded-xl border border-border hover:border-primary transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Minggu Ini
              </button>
              <span className="text-sm text-gray-400">{weekOffset === 0 ? 'Minggu Ini' : 'Minggu Depan'}</span>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                disabled={weekOffset === 1}
                className="px-4 py-2 rounded-xl border border-border hover:border-primary transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Minggu Depan →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-6">
              {availableDates.map(date => (
                <button
                  key={date.date}
                  onClick={() => !date.isPast && setSelectedDate(date.date)}
                  disabled={date.isPast}
                  className={`py-3 rounded-xl text-center transition-all ${
                    selectedDate === date.date ? 'bg-primary text-white'
                    : date.isPast ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-50 border border-border hover:border-primary'
                  }`}
                >
                  <p className="text-xs">{date.day}</p>
                  <p className="text-base font-semibold">{date.dateNum}</p>
                  <p className="text-xs opacity-70">{date.month}</p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Pilih Jam</p>
              {selectedBarber ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <TimeSlot key={slot.time} slot={slot} isSelected={selectedSlot?.time === slot.time} onSelect={setSelectedSlot} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8 bg-gray-50 rounded-xl">Pilih barber terlebih dahulu</p>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="section-title">👤 Data Diri</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="input" placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input" placeholder="081234567890" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-5 border-t border-border">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-outline text-sm px-4 py-2.5">← Kembali</button>}
          {step < 4 && <button onClick={handleNextStep} className="btn-primary ml-auto text-sm px-5 py-2.5">Lanjutkan →</button>}
          {step === 4 && (
            <button onClick={handleBooking} disabled={loading || !customerName || !customerPhone} className="btn-primary ml-auto text-sm px-5 py-2.5">
              {loading ? 'Memproses...' : '✓ Konfirmasi Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}

export default CustomerBooking
