import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LeadModal from './components/LeadModal'
import TasksPage from './components/TasksPage'

export default function App() {
  const [selectedLead, setSelectedLead] = useState(null)
  const [modalMode, setModalMode] = useState(null)

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Dashboard
              onLeadClick={(lead) => { setSelectedLead(lead); setModalMode('view') }}
              onAddLead={() => { setSelectedLead(null); setModalMode('add') }}
            />
          } />
          <Route path="tasks" element={<TasksPage />} />
        </Route>
      </Routes>
      {(modalMode === 'view' && selectedLead) && (
        <LeadModal
          lead={selectedLead}
          onClose={() => { setSelectedLead(null); setModalMode(null) }}
        />
      )}
      {modalMode === 'add' && (
        <LeadModal
          onClose={() => { setSelectedLead(null); setModalMode(null) }}
        />
      )}
    </>
  )
}
