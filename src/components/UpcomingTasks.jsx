import { useState, useEffect } from 'react'
import { getLeads } from '../lib/api'

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    async function load() {
      const leads = await getLeads()
      const allTasks = []
      for (const lead of leads) {
        const res = await fetch(`/api/tasks?lead_id=${lead.id}`)
        const leadTasks = await res.json()
        leadTasks.filter(t => !t.completed).forEach(t => {
          allTasks.push({ ...t, leadName: `${lead.first_name} ${lead.last_name}` })
        })
      }
      allTasks.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
      setTasks(allTasks.slice(0, 5))
    }
    load()
  }, [])

  if (tasks.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Nadchodzące zadania</h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-900">{task.title}</span>
              <span className="text-gray-400 ml-2">— {task.leadName}</span>
            </div>
            {task.due_date && (
              <span className="text-xs text-gray-500">{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
