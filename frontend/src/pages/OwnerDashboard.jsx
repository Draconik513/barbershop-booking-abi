import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const authFetch = (method, url, data = null) => {
  const token = localStorage.getItem('owner_token')
  return api.request({ method, url, data, headers: { Authorization: `Bearer ${token}` } })
}

function OwnerDashboard() {
  const [bookings, setBookings] = useState([])
  const [barbers, setBarbers] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('owner_token')) { navigate('/owner/login', { replace: true }); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [bookingsRes, barbersRes] = await Promise.all([
        authFetch('get', '/owner/bookings'),
        authFetch('get', '/owner/barbers/status'),
      ])
      const data = bookingsRes.data || []
      setBookings(data)
      setStats({
        total: data.length,
        pending: data.filter(b => b.status === 'pending').length,
        completed: data.filter(b => b.status === 'completed').length,
      })
      setBarbers(barbersRes.data || [])
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('owner_token')
        navigate('/owner/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (text, isError = false) => {
    setMessage({ text, isError })
    setTimeout(() => setMessage(null), 3000)
  }

  const refreshBookings = async () => {
    try {
      const res = await authFetch('get', '/owner/bookings')
      const data = res.data || []
      setBookings(data)
      setStats({
        total: data.length,
        pending: data.filter(b => b.status === 'pending').length,
        completed: data.filter(b => b.status === 'completed').length,
      })
    } catch { showMsg('Gagal memperbarui data', true) }
  }

  const updateStatus = async (id, status, name) => {
    const label = { completed: 'selesai', cancelled: 'dibatalkan' }
    if (!confirm(`Tandai booking ${name} sebagai ${label[status]}?`)) return
    try {
      await authFetch('put', `/owner/booking/${id}/status`, { status })
      showMsg(`Booking ${name} telah ${label[status]}`)
      refreshBookings()
    } catch { showMsg('Gagal mengupdate status', true) }
  }

  const deleteBooking = async (id, name) => {
    if (!confirm(`Hapus booking ${name}?`)) return
    try {
      await authFetch('delete', `/owner/booking/${id}`)
      showMsg(`Booking ${name} berhasil dihapus`)
      refreshBookings()
    } catch { showMsg('Gagal menghapus booking', true) }
  }

  const deleteCompleted = async () => {
    const count = bookings.filter(b => b.status === 'completed').length
    if (count === 0) { showMsg('Tidak ada booking selesai', true); return }
    if (!confirm(`Hapus ${count} booking yang sudah selesai?`)) return
    try {
      await authFetch('delete', '/owner/bookings/bulk?status=completed')
      showMsg(`${count} booking selesai dihapus`)
      refreshBookings()
    } catch { showMsg('Gagal menghapus', true) }
  }

  const deleteAllOld = async () => {
    const count = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').length
    if (count === 0) { showMsg('Tidak ada riwayat yang bisa dihapus', true); return }
    if (!confirm(`Hapus semua riwayat (${count} data)? Tidak bisa dibatalkan!`)) return
    try {
      await authFetch('delete', '/owner/bookings/bulk')
      showMsg(`${count} riwayat berhasil dibersihkan`)
      refreshBookings()
    } catch { showMsg('Gagal membersihkan riwayat', true) }
  }

  const updateBarberAvailability = async (barberId, isAvailable, barberName) => {
    const statusText = isAvailable ? 'tersedia' : 'tidak tersedia'
    if (!confirm(`Ubah status ${barberName} menjadi ${statusText}?`)) return
    try {
      await authFetch('put', `/owner/barber/${barberId}/availability`, {
        is_available: isAvailable,
        status_note: isAvailable ? '' : 'Libur',
      })
      showMsg(`Status ${barberName} sekarang ${statusText}`)
      const res = await authFetch('get', '/owner/barbers/status')
      setBarbers(res.data || [])
    } catch { showMsg('Gagal mengupdate status barber', true) }
  }

  const handleLogout = () => {
    localStorage.removeItem('owner_token')
    navigate('/owner/login')
  }

  const statusBadge = (s) => {
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700'
    if (s === 'completed') return 'bg-green-100 text-green-700'
    return 'bg-red-100 text-red-700'
  }

  const statusText = (s) => {
    if (s === 'pending') return '⏳ Menunggu'
    if (s === 'completed') return '✓ Selesai'
    return '✗ Dibatalkan'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Topbar */}
      <div className="bg-primary text-white px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm">✂️</div>
          <div>
            <p className="font-bold text-sm sm:text-base">BarberBook</p>
            <p className="text-xs text-white/50 hidden sm:block">Owner Dashboard</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition">
          🚪 <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {message && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            message.isError ? 'bg-red-500' : 'bg-emerald-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total Booking</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-amber-400">
            <p className="text-xs text-gray-400 mb-1">Menunggu</p>
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-emerald-400">
            <p className="text-xs text-gray-400 mb-1">Selesai</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
          </div>
        </div>

        {/* Barbers Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">💈 Status Barber</h2>
            <button onClick={fetchData} className="text-xs text-accent hover:underline font-medium">🔄 Refresh</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {barbers.map(barber => (
              <div key={barber.id} className="p-3 bg-gray-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{barber.name}</p>
                    <p className="text-xs text-gray-400">{barber.today_bookings} booking hari ini</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    barber.status === 'available' ? 'bg-emerald-100 text-emerald-700'
                    : barber.status === 'busy' ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-600'
                  }`}>
                    {barber.status === 'available' ? '🟢 Available' : barber.status === 'busy' ? '🟡 Busy' : '🔴 Off'}
                  </span>
                </div>
                {barber.status_note && (
                  <p className="text-xs text-gray-500 italic">📝 {barber.status_note}</p>
                )}
                <select
                  value={barber.is_available ? 'available' : 'off'}
                  onChange={e => updateBarberAvailability(barber.id, e.target.value === 'available', barber.name)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-accent"
                >
                  <option value="available">🟢 Tersedia</option>
                  <option value="off">🔴 Libur / Tidak Tersedia</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
          <p className="text-sm font-semibold text-gray-700">{bookings.length} total booking</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={deleteCompleted} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition font-medium">
              🗑️ Hapus Selesai
            </button>
            <button onClick={deleteAllOld} className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs hover:bg-red-100 transition font-medium">
              🗑️ Bersihkan Riwayat
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Kode</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Layanan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Barber</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Jadwal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-12 text-gray-400 text-sm">Belum ada booking</td></tr>
                ) : (
                  bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50/70 transition">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-accent">{booking.booking_code}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs text-gray-800">{booking.customer_name}</p>
                        <p className="text-xs text-gray-400">{booking.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{booking.service_name}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{booking.barber_name}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-800">{booking.booking_date}</p>
                        <p className="text-xs text-gray-400">{booking.time_slot} WIB</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(booking.status)}`}>
                          {statusText(booking.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {booking.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(booking.id, 'completed', booking.customer_name)} className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 transition font-medium">✓ Selesai</button>
                              <button onClick={() => updateStatus(booking.id, 'cancelled', booking.customer_name)} className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition font-medium">✗ Batal</button>
                            </>
                          )}
                          {booking.status === 'completed' && (
                            <button onClick={() => window.open(`https://wa.me/${booking.customer_phone}`, '_blank')} className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700 transition font-medium">💬 WA</button>
                          )}
                          <button onClick={() => deleteBooking(booking.id, booking.customer_name)} className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-red-500 hover:text-white transition">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default OwnerDashboard
