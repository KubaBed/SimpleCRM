import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import { STAGE_ORDER } from '../data/pipeline'

export default function KanbanBoard({ leads, onStageChange, onLeadClick, onContact }) {
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
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
        {STAGE_ORDER.map(stage => (
          <div key={stage} className="snap-start shrink-0">
            <KanbanColumn
              stageKey={stage}
              leads={leadsByStage[stage]}
              onLeadClick={onLeadClick}
              onContact={onContact}
            />
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
