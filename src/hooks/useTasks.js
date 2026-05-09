import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask as apiCreate, updateTask as apiUpdate } from '../lib/api'

export function useTasks(leadId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!leadId) { setTasks([]); setLoading(false); return }
    try {
      setLoading(true)
      const data = await getTasks(leadId)
      setTasks(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const add = async (data) => {
    const task = await apiCreate(leadId, data)
    setTasks(prev => [...prev, task])
    return task
  }

  const toggle = async (id, completed) => {
    const updated = await apiUpdate(id, { completed })
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }

  return { tasks, loading, add, toggle, refetch: fetchTasks }
}
