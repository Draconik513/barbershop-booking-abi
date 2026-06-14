function BarberCard({ barber, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(barber)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-accent bg-accent/5 shadow-sm'
          : 'border-border hover:border-accent/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isSelected ? 'bg-accent/10' : 'bg-gray-100'}`}>
            💈
          </div>
          <div>
            <p className="font-semibold text-sm text-primary">{barber.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-amber-400 text-xs">★</span>
              <span className="text-xs font-medium">{barber.rating}</span>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-xs text-text-light">{barber.total_bookings} booking</span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-text-light">{barber.start_time} – {barber.end_time}</p>
          {isSelected && <p className="text-xs text-accent mt-0.5">✓ Dipilih</p>}
        </div>
      </div>
    </div>
  )
}

export default BarberCard
