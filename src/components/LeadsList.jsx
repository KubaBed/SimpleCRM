import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { STAGES } from '../data/pipeline'
import { getInitials, getAvatarColor } from '../lib/avatar'
import { formatRelativePl } from '../lib/dates'
import { getDaysInStage, isStale } from '../hooks/useStaleness'

const SOURCE_COLORS = {
  Email: 'bg-blue-100 text-blue-700',
  LinkedIn: 'bg-indigo-100 text-indigo-700',
  Polecenie: 'bg-emerald-100 text-emerald-700',
  'Strona WWW': 'bg-amber-100 text-amber-700',
  Inne: 'bg-gray-100 text-gray-600',
}

const COLS = [
  { key: 'name', label: 'Lead', sortable: true, width: 'flex-1 min-w-[180px]' },
  { key: 'stage', label: 'Stage', sortable: true, width: 'w-28' },
  { key: 'source', label: 'Źródło', sortable: true, width: 'w-24' },
  { key: 'estimated_value', label: 'Wartość', sortable: true, width: 'w-28', align: 'right' },
  { key: 'last_contacted_at', label: 'Kontakt', sortable: true, width: 'w-32' },
  { key: 'days_in_stage', label: 'Stage od', sortable: true, width: 'w-20', align: 'right' },
]

function getSortVal(lead, key) {
  switch (key) {
    case 'name': return `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase()
    case 'stage': return STAGES.findIndex((s) => s.key === lead.stage)
    case 'source': return (lead.source || '').toLowerCase()
    case 'estimated_value': return Number(lead.estimated_value || 0)
    case 'last_contacted_at': return lead.last_contacted_at ? new Date(lead.last_contacted_at).getTime() : 0
    case 'days_in_stage': return getDaysInStage(lead)
    default: return 0
  }
}

function copyToClipboard(text, label = 'Skopiowano') {
  if (!navigator?.clipboard) return
  navigator.clipboard.writeText(text).then(
    () => toast.success(label),
    () => toast.error('Nie udało się skopiować')
  )
}

function stop(e) { e.stopPropagation() }

export default function LeadsList({ leads, onLeadClick, onContact, selectedIds, onToggleSelect, onToggleAll }) {
  const [sort, setSort] = useState({ key: 'last_contacted_at', dir: 'desc' })
  const allSelected = selectedIds && selectedIds.size > 0 && leads.every((l) => selectedIds.has(l.id))
  const someSelected = selectedIds && selectedIds.size > 0 && !allSelected

  const sorted = useMemo(() => {
    const copy = [...leads]
    copy.sort((a, b) => {
      const av = getSortVal(a, sort.key)
      const bv = getSortVal(b, sort.key)
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [leads, sort])

  const handleSort = (key) => {
    setSort((prev) => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="hidden md:flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {onToggleAll && (
          <div className="w-7 shrink-0 flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected }}
              onChange={onToggleAll}
              className="rounded border-gray-300"
              title="Zaznacz wszystkie"
            />
          </div>
        )}
        {COLS.map((col) => (
          <button
            key={col.key}
            type="button"
            onClick={() => col.sortable && handleSort(col.key)}
            className={`${col.width} ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sortable ? 'hover:text-gray-900' : ''} flex items-center ${col.align === 'right' ? 'justify-end' : ''} gap-1`}
          >
            {col.label}
            {col.sortable && sort.key === col.key && (
              <span className="text-[10px]">{sort.dir === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-100">
        {sorted.map((lead) => {
          const stage = STAGES.find((s) => s.key === lead.stage)
          const stale = isStale(lead)
          const days = getDaysInStage(lead)
          const sourceColor = SOURCE_COLORS[lead.source] || SOURCE_COLORS.Inne
          const initials = getInitials(lead.first_name, lead.last_name)
          const avatarColor = getAvatarColor(`${lead.first_name || ''} ${lead.last_name || ''}` || lead.email || lead.id)

          const isSelected = selectedIds?.has(lead.id)

          return (
            <div
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className={`group flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm ${isSelected ? 'bg-gray-50' : ''}`}
            >
              {onToggleSelect && (
                <div className="w-7 shrink-0 hidden md:flex items-center" onClick={stop}>
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={(e) => { stop(e); onToggleSelect(lead.id) }}
                    onClick={stop}
                    className="rounded border-gray-300"
                  />
                </div>
              )}
              <div className="flex-1 min-w-[180px] flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${avatarColor}`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {lead.first_name} {lead.last_name}
                  </div>
                  {lead.company_name && (
                    <div className="text-xs text-gray-500 truncate">{lead.company_name}</div>
                  )}
                </div>
                <div className="ml-auto md:hidden flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={stop}>
                  {lead.email && <a href={`mailto:${lead.email}`} onClick={(e) => { stop(e); onContact && onContact(lead.id) }} className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 text-sm">✉</a>}
                </div>
              </div>

              <div className="hidden md:block w-28">
                {stage && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${stage.color}`}>
                    {stage.label}
                  </span>
                )}
              </div>

              <div className="hidden md:block w-24">
                {lead.source && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${sourceColor}`}>
                    {lead.source}
                  </span>
                )}
              </div>

              <div className="hidden md:block w-28 text-right text-gray-900 text-xs">
                {lead.estimated_value
                  ? `${Number(lead.estimated_value).toLocaleString('pl-PL')} PLN`
                  : <span className="text-gray-300">—</span>}
              </div>

              <div className="hidden md:block w-32 text-xs text-gray-500">
                {lead.last_contacted_at ? formatRelativePl(lead.last_contacted_at) : <span className="text-gray-300">—</span>}
              </div>

              <div className="hidden md:flex w-20 items-center justify-end gap-1.5">
                {stale ? (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">🔴 {days}d</span>
                ) : (
                  <span className="text-xs text-gray-400">{days}d</span>
                )}
              </div>

              <div className="hidden md:flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={stop} onMouseDown={stop}>
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={(e) => { stop(e); onContact && onContact(lead.id) }}
                    title="Wyślij email"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
                  >✉</a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(e) => { stop(e); onContact && onContact(lead.id) }}
                    title="Zadzwoń"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
                  >☎</a>
                )}
                {lead.website && (
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={stop}
                    title="Otwórz stronę WWW"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
                  >⌘</a>
                )}
                {lead.email && (
                  <button
                    type="button"
                    onClick={(e) => { stop(e); copyToClipboard(lead.email, 'Skopiowano email') }}
                    title="Skopiuj email"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 text-sm"
                  >⧉</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
