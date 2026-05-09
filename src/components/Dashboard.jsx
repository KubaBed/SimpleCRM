import StatsBar from './StatsBar'
import KanbanBoard from './KanbanBoard'
import UpcomingTasks from './UpcomingTasks'
import EmptyState from './EmptyState'
import { useLeads } from '../hooks/useLeads'

export default function Dashboard({ onLeadClick, onAddLead }) {
  const { leads, loading, update } = useLeads()

  const handleStageChange = (leadId, newStage) => {
    update(leadId, { stage: newStage })
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Ładowanie...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
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
          <KanbanBoard leads={leads} onStageChange={handleStageChange} onLeadClick={onLeadClick} />
          <div className="mt-6">
            <UpcomingTasks />
          </div>
        </>
      )}
    </div>
  )
}
