import { motion } from 'framer-motion'

export default function LeadCard({ lead, provided, onClick }) {
  return (
    <motion.div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all mb-2"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="font-medium text-sm text-gray-900">
        {lead.first_name} {lead.last_name}
      </div>
      {lead.company_name && (
        <div className="text-xs text-gray-500 mt-0.5">{lead.company_name}</div>
      )}
      {lead.estimated_value && (
        <div className="text-xs font-medium text-gray-900 mt-1">
          {Number(lead.estimated_value).toLocaleString('pl-PL')} PLN
        </div>
      )}
    </motion.div>
  )
}
