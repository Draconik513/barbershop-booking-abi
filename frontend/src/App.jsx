import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerBooking from './pages/CustomerBooking'
import OwnerLogin from './pages/OwnerLogin'
import OwnerDashboard from './pages/OwnerDashboard'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('owner_token')
  if (!token) return <Navigate to="/owner/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Navbar /><CustomerBooking /></>} />
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
