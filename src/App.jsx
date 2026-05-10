import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LeadModal from './components/LeadModal'
import TasksPage from './components/TasksPage'
import Login from './components/Login'
import { useLeads } from './hooks/useLeads'
import { generateBrief } from './lib/api'

function AuthGate({ children }) {
  const [authState, setAuthState] = useState('loading') // loading | authed | unauthed
  const location = useLocation()

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => { if (active) setAuthState(r.ok ? 'authed' : 'unauthed') })
      .catch(() => { if (active) setAuthState('unauthed') })
    return () => { active = false }
  }, [])

  if (authState === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">…</div>
  }

  if (authState === 'unauthed') {
    const next = location.pathname + location.search
    const target = next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login'
    return <Navigate to={target} replace />
  }

  return children
}

function AuthedApp() {
  const { leads, loading, create, update, remove } = useLeads()
  const [selectedLead, setSelectedLead] = useState(null)
  const [modalMode, setModalMode] = useState(null)

  const closeModal = () => { setSelectedLead(null); setModalMode(null) }

  const handleContact = (id) => {
    update(id, { last_contacted_at: new Date().toISOString() }).catch(() => {})
  }

  const handleSave = async (data) => {
    if (selectedLead) {
      const updated = await update(selectedLead.id, data)
      setSelectedLead(updated)
      return updated
    }
    const created = await create(data)
    setSelectedLead(created)
    return created
  }

  const handleDelete = async () => {
    if (!selectedLead) return
    await remove(selectedLead.id)
    closeModal()
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Dashboard
              leads={leads}
              loading={loading}
              modalOpen={modalMode != null}
              onStageChange={(id, stage) => update(id, { stage })}
              onLeadClick={(lead) => { setSelectedLead(lead); setModalMode('view') }}
              onAddLead={() => { setSelectedLead(null); setModalMode('add') }}
              onContact={handleContact}
              onDelete={remove}
            />
          } />
          <Route path="tasks" element={<TasksPage />} />
        </Route>
      </Routes>
      {(modalMode === 'view' && selectedLead) && (
        <LeadModal
          lead={selectedLead}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
          onContact={handleContact}
          onGenerateBrief={generateBrief}
        />
      )}
      {modalMode === 'add' && (
        <LeadModal
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AuthGate><AuthedApp /></AuthGate>} />
      </Routes>
    </>
  )
}
