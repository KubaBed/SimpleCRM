import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import StatsBar from './StatsBar'
import KanbanBoard from './KanbanBoard'
import LeadsList from './LeadsList'
import UpcomingTasks from './UpcomingTasks'
import EmptyState from './EmptyState'
import SearchBar from './SearchBar'
import FilterChips from './FilterChips'
import BulkToolbar from './BulkToolbar'
import { DashboardSkeleton } from './Skeleton'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { isStale } from '../hooks/useStaleness'

function matchesSearch(lead, q) {
  if (!q) return true
  const needle = q.toLowerCase().trim()
  if (!needle) return true
  return [lead.first_name, lead.last_name, lead.email, lead.company_name, lead.phone, lead.website]
    .filter(Boolean)
    .some((s) => String(s).toLowerCase().includes(needle))
}

export default function Dashboard({ leads, loading, modalOpen, onStageChange, onLeadClick, onAddLead, onContact, onDelete }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ sources: new Set(), stale: false, hasValue: false })
  const [view, setView] = useState(() => {
    if (typeof window === 'undefined') return 'kanban'
    return window.localStorage.getItem('crm.view') === 'list' ? 'list' : 'kanban'
  })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const searchRef = useRef(null)

  useEffect(() => {
    window.localStorage.setItem('crm.view', view)
    setSelectedIds(new Set())
  }, [view])

  useKeyboardShortcuts({
    n: () => { if (!modalOpen) onAddLead() },
    '/': () => { if (!modalOpen) searchRef.current?.focus() },
  })

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const bulkMove = async (stage) => {
    const ids = [...selectedIds]
    try {
      await Promise.all(ids.map((id) => onStageChange(id, stage)))
      toast.success(`Przeniesiono ${ids.length}`)
    } catch (err) {
      toast.error(err?.message || 'Nie udało się przenieść')
    }
    clearSelection()
  }

  const bulkDelete = async () => {
    const ids = [...selectedIds]
    if (!window.confirm(`Usunąć ${ids.length} leadów? Tej operacji nie można cofnąć.`)) return
    try {
      await Promise.all(ids.map((id) => onDelete && onDelete(id)))
      toast.success(`Usunięto ${ids.length}`)
    } catch (err) {
      toast.error(err?.message || 'Nie udało się usunąć')
    }
    clearSelection()
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (!matchesSearch(l, search)) return false
      if (filters.stale && !isStale(l)) return false
      if (filters.hasValue && !l.estimated_value) return false
      if (filters.sources.size > 0 && !filters.sources.has(l.source)) return false
      return true
    })
  }, [leads, search, filters])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'kanban' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Widok Kanban"
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Widok listy"
            >
              Lista
            </button>
          </div>
          <button
            onClick={onAddLead}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            title="Nowy lead [n]"
          >
            + Nowy lead
          </button>
        </div>
      </div>

      <StatsBar leads={leads} />

      {leads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Brak leadów"
          description="Dodaj pierwszego leada lub poczekaj na automatyczne utworzenie z maila."
          action={
            <button
              onClick={onAddLead}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              + Nowy lead
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              inputRef={searchRef}
              placeholder="Szukaj leada (imię, firma, email, telefon, www)... [/]"
            />
          </div>
          <div className="mb-4">
            <FilterChips filters={filters} onChange={setFilters} />
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">
              Brak wyników dla wybranych kryteriów.
            </div>
          ) : view === 'kanban' ? (
            <KanbanBoard
              leads={filteredLeads}
              onStageChange={onStageChange}
              onLeadClick={onLeadClick}
              onContact={onContact}
            />
          ) : (
            <LeadsList
              leads={filteredLeads}
              onLeadClick={onLeadClick}
              onContact={onContact}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
            />
          )}

          <BulkToolbar
            count={selectedIds.size}
            onMoveToStage={bulkMove}
            onDelete={bulkDelete}
            onClear={clearSelection}
          />

          <div className="mt-6">
            <UpcomingTasks />
          </div>
        </>
      )}
    </div>
  )
}
