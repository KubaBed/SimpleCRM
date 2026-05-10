const SOURCE_CHIPS = ['Email', 'LinkedIn', 'Polecenie', 'Strona WWW', 'Inne']

function Chip({ active, onClick, children, color = 'gray' }) {
  const palette = active
    ? color === 'rose'
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : color === 'amber'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-gray-900 text-white border-gray-900'
    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${palette}`}
    >
      {children}
    </button>
  )
}

export default function FilterChips({ filters, onChange }) {
  const allClear =
    filters.sources.size === 0 && !filters.stale && !filters.hasValue

  const toggleSource = (s) => {
    const next = new Set(filters.sources)
    if (next.has(s)) next.delete(s)
    else next.add(s)
    onChange({ ...filters, sources: next })
  }

  const toggle = (key) => onChange({ ...filters, [key]: !filters[key] })

  const clearAll = () =>
    onChange({ sources: new Set(), stale: false, hasValue: false })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip active={allClear} onClick={clearAll}>
        Wszystkie
      </Chip>
      <span className="text-gray-300">|</span>
      <Chip active={filters.stale} onClick={() => toggle('stale')} color="rose">
        🔴 Stale
      </Chip>
      <Chip active={filters.hasValue} onClick={() => toggle('hasValue')} color="amber">
        💰 Z wartością
      </Chip>
      <span className="text-gray-300">|</span>
      {SOURCE_CHIPS.map((s) => (
        <Chip
          key={s}
          active={filters.sources.has(s)}
          onClick={() => toggleSource(s)}
        >
          {s}
        </Chip>
      ))}
    </div>
  )
}
