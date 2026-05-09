import { useState } from 'react'
import { updateLead } from '../lib/api'

export default function NotesSection({ leadId, notes: initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '')

  const save = async () => {
    await updateLead(leadId, { notes })
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="Notatki..."
        rows={8}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
      />
      <button
        onClick={save}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        Zapisz notatki
      </button>
    </div>
  )
}
