import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import LeadForm from './LeadForm'
import NotesSection from './NotesSection'
import ActivityTimeline from './ActivityTimeline'
import TaskList from './TaskList'
import { useLeads } from '../hooks/useLeads'
import { createLead, updateLead } from '../lib/api'

export default function LeadModal({ lead, onClose }) {
  const isNew = !lead
  const [currentLead, setCurrentLead] = useState(lead)
  const { refetch } = useLeads()
  const [activeTab, setActiveTab] = useState('info')

  const handleSave = async (data) => {
    try {
      if (isNew) {
        const created = await createLead(data)
        setCurrentLead(created)
        toast.success('Lead utworzony')
      } else {
        const updated = await updateLead(currentLead.id, data)
        setCurrentLead(updated)
        toast.success('Zapisano')
      }
      refetch()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const tabs = [
    { key: 'info', label: 'Informacje' },
    { key: 'notes', label: 'Notatki' },
    { key: 'tasks', label: 'Zadania' },
  ]
  if (!isNew) tabs.push({ key: 'activity', label: 'Historia' })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        <motion.div
          className="absolute inset-0 bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-lg bg-white h-full shadow-xl flex flex-col"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100 gap-3">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {isNew ? 'Nowy lead' : `${currentLead?.first_name || ''} ${currentLead?.last_name || ''}`}
            </h3>
            <div className="flex items-center gap-1">
              {!isNew && currentLead?.email && (
                <a
                  href={`mailto:${currentLead.email}`}
                  title="Wyślij email"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >✉</a>
              )}
              {!isNew && currentLead?.phone && (
                <a
                  href={`tel:${currentLead.phone}`}
                  title="Zadzwoń"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >☎</a>
              )}
              {!isNew && currentLead?.email && (
                <button
                  type="button"
                  title="Skopiuj email"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(currentLead.email)
                        .then(() => toast.success('Skopiowano email'))
                        .catch(() => toast.error('Nie udało się skopiować'))
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >⧉</button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none ml-1"
                title="Zamknij"
              >&times;</button>
            </div>
          </div>

          <div className="flex border-b border-gray-100 px-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'info' && (
              <LeadForm lead={currentLead} onSave={handleSave} isNew={isNew} />
            )}
            {activeTab === 'notes' && currentLead && (
              <NotesSection leadId={currentLead.id} notes={currentLead.notes} />
            )}
            {activeTab === 'tasks' && currentLead && (
              <TaskList leadId={currentLead.id} />
            )}
            {activeTab === 'activity' && currentLead && (
              <ActivityTimeline leadId={currentLead.id} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
