import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const API_URL = ''

function OwnerLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/owner/login', { username, password })
      if (res.data.success && res.data.token) {
        localStorage.setItem('owner_token', res.data.token)
        window.location.href = '/owner/dashboard'
      } else {
        setError('Login gagal, coba lagi')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✂️</span>
          </div>
          <h2 className="text-2xl font-semibold text-primary">Owner Access</h2>
          <p className="text-sm text-text-light mt-1">Masuk untuk mengelola dashboard</p>
        </div>

        <form className="card space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="owner"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>

          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center space-y-1">
            <p className="font-semibold text-gray-600 mb-2">Demo Credentials</p>
            <button
              type="button"
              onClick={() => { setUsername('owner'); setPassword('barbershop123') }}
              className="w-full py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition text-xs text-gray-500"
            >
              👆 Klik untuk isi otomatis: <span className="font-mono font-semibold">owner / barbershop123</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OwnerLogin