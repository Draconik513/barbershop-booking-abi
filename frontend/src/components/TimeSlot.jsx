function TimeSlot({ slot, isSelected, onSelect }) {
  const getSlotClass = () => {
    if (isSelected) return 'bg-accent border-accent text-white rounded-xl py-2 text-sm font-medium shadow-sm'
    if (!slot.available) {
      if (slot.status === 'completed') {
        return 'bg-green-100 border border-green-300 text-green-700 rounded-xl py-2 text-sm cursor-not-allowed'
      }
      return 'bg-gray-100 border border-gray-200 text-gray-400 rounded-xl py-2 text-sm cursor-not-allowed'
    }
    return 'bg-gray-50 border border-gray-200 text-gray-700 rounded-xl py-2 text-sm hover:border-accent hover:bg-orange-50 hover:text-accent cursor-pointer transition-all duration-200'
  }

  const getSlotDisplay = () => {
    if (!slot.available) {
      if (slot.status === 'completed') {
        return (
          <div className="text-center">
            <div className="text-sm font-medium">{slot.time}</div>
            <div className="text-xs mt-0.5">✓ Selesai</div>
          </div>
        )
      }
      return (
        <div className="text-center">
          <div className="text-sm font-medium line-through">{slot.time}</div>
          <div className="text-xs mt-0.5">Terisi</div>
        </div>
      )
    }
    if (isSelected) {
      return (
        <div className="text-center">
          <div className="text-sm font-medium">{slot.time}</div>
          <div className="text-xs mt-0.5">✓ Dipilih</div>
        </div>
      )
    }
    return (
      <div className="text-center">
        <div className="text-sm font-medium">{slot.time}</div>
        <div className="text-xs mt-0.5 opacity-60">Tersedia</div>
      </div>
    )
  }

  return (
    <button
      onClick={() => slot.available && onSelect(slot)}
      disabled={!slot.available}
      className={getSlotClass()}
      title={slot.message || ''}
    >
      {getSlotDisplay()}
    </button>
  )
}

export default TimeSlot
