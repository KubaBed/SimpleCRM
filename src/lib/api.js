const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export function getLeads(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return request(`/leads${qs ? `?${qs}` : ''}`)
}

export function createLead(data) {
  return request('/leads', { method: 'POST', body: JSON.stringify(data) })
}

export function updateLead(id, data) {
  return request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteLead(id) {
  return request(`/leads/${id}`, { method: 'DELETE' })
}

export function getTasks(leadId) {
  return request(`/tasks?lead_id=${leadId}`)
}

export function createTask(leadId, data) {
  return request(`/tasks?lead_id=${leadId}`, { method: 'POST', body: JSON.stringify(data) })
}

export function updateTask(taskId, data) {
  return request(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function getActivity(leadId) {
  return request(`/activity?lead_id=${leadId}`)
}
