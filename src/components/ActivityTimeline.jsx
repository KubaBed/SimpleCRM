import { useState, useEffect } from 'react'
import { getActivity } from '../lib/api'

export default function ActivityTimeline({ leadId }) {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    getActivity(leadId).then(setActivities).catch(console.error)
  }, [leadId])

  if (activities.length === 0) return <p className="text-sm text-gray-400">Brak aktywności</p>

  return (
    <div className="space-y-3">
      {activities.map(a => (
        <div key={a.id} className="flex gap-3 text-sm">
          <span className="text-xs text-gray-400 mt-0.5 shrink-0">
            {new Date(a.created_at).toLocaleString('pl-PL')}
          </span>
          <span className="text-gray-700">{a.description}</span>
        </div>
      ))}
    </div>
  )
}
