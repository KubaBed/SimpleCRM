export default function LeadModal({ lead, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl p-6 overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        <h3 className="text-lg font-bold mb-4">{lead ? `${lead.first_name} ${lead.last_name}` : 'Nowy lead'}</h3>
        <p className="text-gray-400">Lead detail — coming soon</p>
      </div>
    </div>
  )
}
