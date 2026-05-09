import { useState, useEffect } from 'react'
import EmptyState from './EmptyState'
import { getLeads } from '../lib/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTasks = async () => {
    try {
      const leads = await getLeads()
      const allTasks = []
      for (const lead of leads) {
        const res = await fetch(`/api/tasks?lead_id=${lead.id}`)
        const leadTasks = await res.json()
        leadTasks.forEach(t => {
          allTasks.push({ ...t, leadName: `${lead.first_name} ${lead.last_name}`, leadId: lead.id })
        })
      }
      allTasks.sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
      setTasks(allTasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTasks() }, [])

  const toggleTask = async (taskId, completed) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    })
    loadTasks()
  }

  if (loading) return <div className="p-8 text-gray-400">Ładowanie...</div>

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Zadania</h2>

      {pending.length === 0 && done.length === 0 ? (
        <EmptyState
          icon="✓"
          title="Brak zadań"
          description="Dodaj zadania z poziomu karty leada."
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {pending.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleTask(task.id, true)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-900">{task.title}</span>
                  <span className="text-xs text-gray-400 ml-2">— {task.leadName}</span>
                </div>
                {task.due_date && (
                  <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
                )}
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <details className="text-sm">
              <summary className="text-gray-400 cursor-pointer">Ukończone ({done.length})</summary>
              <div className="mt-2 space-y-1">
                {done.map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => toggleTask(task.id, false)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-400 line-through">{task.title}</span>
                    <span className="text-xs text-gray-300 ml-2">— {task.leadName}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
