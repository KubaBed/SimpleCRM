import { Droppable, Draggable } from '@hello-pangea/dnd'
import LeadCard from './LeadCard'
import { STAGES } from '../data/pipeline'

export default function KanbanColumn({ stageKey, leads, onLeadClick, onContact }) {
  const stage = STAGES.find(s => s.key === stageKey)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{leads.length}</span>
      </div>
      <Droppable droppableId={stageKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-lg p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'
            }`}
          >
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided) => (
                  <LeadCard lead={lead} provided={provided} onClick={() => onLeadClick(lead)} onContact={onContact} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
