export default function StatsBar({ leads }) {
  const total = leads.length
  const won = leads.filter(l => l.stage === 'wygrana').length
  const lost = leads.filter(l => l.stage === 'przegrana').length
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0
  const pipelineValue = leads
    .filter(l => !['wygrana', 'przegrana'].includes(l.stage) && l.estimated_value)
    .reduce((sum, l) => sum + Number(l.estimated_value), 0)
  const wonValue = leads
    .filter(l => l.stage === 'wygrana' && l.won_value)
    .reduce((sum, l) => sum + Number(l.won_value), 0)

  const stats = [
    { label: 'Wszystkie leady', value: total },
    { label: 'Win rate', value: `${winRate}%` },
    { label: 'Pipeline', value: `${pipelineValue.toLocaleString('pl-PL')} PLN` },
    { label: 'Wygrane', value: `${wonValue.toLocaleString('pl-PL')} PLN` }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map(stat => (
        <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}
