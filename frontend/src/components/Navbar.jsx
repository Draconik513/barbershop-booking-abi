import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  if (location.pathname.startsWith('/owner')) return null

  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm">✂️</div>
          <span className="text-lg font-bold tracking-tight">BarberBook</span>
        </Link>
        <span className="text-xs text-white/50 hidden sm:block">Book your style, anytime</span>
      </div>
    </nav>
  )
}

export default Navbar
