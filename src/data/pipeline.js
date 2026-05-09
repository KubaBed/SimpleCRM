export const STAGES = [
  { key: 'nowy', label: 'Nowy', color: 'bg-slate-200 text-slate-700' },
  { key: 'kontakt', label: 'Kontakt', color: 'bg-blue-100 text-blue-700' },
  { key: 'konsultacja', label: 'Konsultacja', color: 'bg-purple-100 text-purple-700' },
  { key: 'oferta', label: 'Oferta', color: 'bg-amber-100 text-amber-700' },
  { key: 'wygrana', label: 'Wygrana', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'przegrana', label: 'Przegrana', color: 'bg-rose-100 text-rose-700' }
]

export const STAGE_ORDER = STAGES.map(s => s.key)
