import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import { STAGE_ORDER } from '../data/pipeline'

export default function KanbanBoard({ leads, onStageChange, onLeadClick }) {
  const leadsByStage = {}
  STAGE_ORDER.forEach(stage => { leadsByStage[stage] = [] })
  leads.forEach(lead => {
    if (leadsByStage[lead.stage]) leadsByStage[lead.stage].push(lead)
  })

  const handleDragEnd = (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    onStageChange(draggableId, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map(stage => (
          <KanbanColumn
            key={stage}
            stageKey={stage}
            leads={leadsByStage[stage]}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
