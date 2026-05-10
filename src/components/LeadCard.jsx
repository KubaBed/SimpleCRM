import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getDaysInStage, isStale } from '../hooks/useStaleness'

const SOURCE_COLORS = {
  Email: 'bg-blue-100 text-blue-700',
  LinkedIn: 'bg-indigo-100 text-indigo-700',
  Polecenie: 'bg-emerald-100 text-emerald-700',
  'Strona WWW': 'bg-amber-100 text-amber-700',
  Inne: 'bg-gray-100 text-gray-600',
}

function stop(e) { e.stopPropagation() }

function copyToClipboard(text, label = 'Skopiowano') {
  if (!navigator?.clipboard) return
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error('Nie udało się skopiować')
  )
}

export default function LeadCard({ lead, provided, onClick }) {
  const days = getDaysInStage(lead)
  const stale = isStale(lead)
  const sourceColor = SOURCE_COLORS[lead.source] || SOURCE_COLORS.Inne

  return (
    <motion.div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      onClick={onClick}
      className="group bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all mb-2"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-gray-900 truncate">
            {lead.first_name} {lead.last_name}
          </div>
          {lead.company_name && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">{lead.company_name}</div>
          )}
        </div>
        {stale && (
          <span
            className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 text-rose-700"
            title={`Stoi w stage'u ${days} dni`}
          >
            🔴 {days}d
          </span>
        )}
        {!stale && days >= 1 && (
          <span
            className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
            title={`Ostatnia zmiana ${days} dni temu`}
          >
            {days}d
          </span>
        )}
      </div>

      {(lead.email || lead.phone) && (
        <div className="mt-2 space-y-0.5">
          {lead.email && (
            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
              <span className="text-gray-400">@</span>
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
              <span className="text-gray-400">☎</span>
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {lead.source && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sourceColor}`}>
              {lead.source}
            </span>
          )}
          {lead.estimated_value && (
            <span className="text-xs font-medium text-gray-900">
              {Number(lead.estimated_value).toLocaleString('pl-PL')} PLN
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={stop}
          onMouseDown={stop}
        >
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={stop}
              title="Wyślij email"
              className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
            >
              ✉
            </a>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={stop}
              title="Zadzwoń"
              className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
            >
              ☎
            </a>
          )}
          {lead.website && (
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stop}
              title="Otwórz stronę WWW"
              className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
            >
              ⌘
            </a>
          )}
          {lead.email && (
            <button
              type="button"
              onClick={(e) => { stop(e); copyToClipboard(lead.email, 'Skopiowano email') }}
              title="Skopiuj email"
              className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
            >
              ⧉
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
