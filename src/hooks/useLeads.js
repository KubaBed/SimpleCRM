import { useState, useEffect, useCallback } from 'react'
import { getLeads, createLead as apiCreate, updateLead as apiUpdate, deleteLead as apiDelete } from '../lib/api'

export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getLeads()
      setLeads(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const create = async (data) => {
    const lead = await apiCreate(data)
    setLeads(prev => [lead, ...prev])
    return lead
  }

  const update = async (id, data) => {
    const updated = await apiUpdate(id, data)
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
    return updated
  }

  const remove = async (id) => {
    await apiDelete(id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  return { leads, loading, error, create, update, remove, refetch: fetchLeads }
}
