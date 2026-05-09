import TaskForm from './TaskForm'
import { useTasks } from '../hooks/useTasks'

export default function TaskList({ leadId }) {
  const { tasks, loading, add, toggle } = useTasks(leadId)

  if (loading) return <p className="text-sm text-gray-400">Ładowanie...</p>

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)

  return (
    <div className="space-y-4">
      <TaskForm onSubmit={add} />
      <div className="space-y-2">
        {pending.map(task => (
          <label key={task.id} className="flex items-center gap-3 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={false}
              onChange={() => toggle(task.id, true)}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-900">{task.title}</span>
              {task.due_date && (
                <span className="text-xs text-gray-400 ml-2">{new Date(task.due_date).toLocaleDateString('pl-PL')}</span>
              )}
            </div>
          </label>
        ))}
      </div>
      {done.length > 0 && (
        <details className="text-sm">
          <summary className="text-gray-400 cursor-pointer">Ukończone ({done.length})</summary>
          <div className="mt-2 space-y-1">
            {done.map(task => (
              <label key={task.id} className="flex items-center gap-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggle(task.id, false)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-400 line-through">{task.title}</span>
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
