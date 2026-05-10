import { useMemo, useState } from 'react'
import StatsBar from './StatsBar'
import KanbanBoard from './KanbanBoard'
import UpcomingTasks from './UpcomingTasks'
import EmptyState from './EmptyState'
import SearchBar from './SearchBar'
import { useLeads } from '../hooks/useLeads'

function matchesSearch(lead, q) {
  if (!q) return true
  const needle = q.toLowerCase().trim()
  if (!needle) return true
  return [lead.first_name, lead.last_name, lead.email, lead.company_name, lead.phone]
    .filter(Boolean)
    .some((s) => String(s).toLowerCase().includes(needle))
}

export default function Dashboard({ onLeadClick, onAddLead }) {
  const { leads, loading, update } = useLeads()
  const [search, setSearch] = useState('')

  const filteredLeads = useMemo(
    () => leads.filter((l) => matchesSearch(l, search)),
    [leads, search]
  )

  const handleStageChange = (leadId, newStage) => {
    update(leadId, { stage: newStage })
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Ładowanie...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={onAddLead}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Nowy lead
        </button>
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
          <div className="mb-4">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Szukaj leada (imię, firma, email, telefon)..."
            />
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">
              Brak wyników dla „{search}".
            </div>
          ) : (
            <KanbanBoard
              leads={filteredLeads}
              onStageChange={handleStageChange}
              onLeadClick={onLeadClick}
            />
          )}

          <div className="mt-6">
            <UpcomingTasks />
          </div>
        </>
      )}
    </div>
  )
}
