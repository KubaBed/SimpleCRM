import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import LeadForm from './LeadForm'
import NotesSection from './NotesSection'
import ActivityTimeline from './ActivityTimeline'
import TaskList from './TaskList'
import { formatRelativePl } from '../lib/dates'
import { generateLeadBrief } from '../lib/api'

export default function LeadModal({ lead, onClose, onSave, onDelete, onContact }) {
  const isNew = !lead
  const [currentLead, setCurrentLead] = useState(lead)
  const [activeTab, setActiveTab] = useState('info')
  const [deleting, setDeleting] = useState(false)
  const [generatingBrief, setGeneratingBrief] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = async (data) => {
    try {
      const result = await onSave(data)
      if (result) setCurrentLead(result)
      toast.success(isNew ? 'Lead utworzony' : 'Zapisano')
    } catch (err) {
      toast.error(err.message || 'Coś poszło nie tak')
    }
  }

  const handleGenerateBrief = async () => {
    if (!currentLead?.id || generatingBrief) return
    setGeneratingBrief(true)
    const toastId = toast.loading('Generuję brief…')
    try {
      const { lead: updated } = await generateLeadBrief(currentLead.id)
      setCurrentLead(updated)
      setActiveTab('notes')
      toast.success('Brief gotowy', { id: toastId })
    } catch (err) {
      toast.error(err.message || 'Nie udało się wygenerować briefu', { id: toastId })
    } finally {
      setGeneratingBrief(false)
    }
  }

  const handleDeleteClick = async () => {
    if (!currentLead || !onDelete) return
    const name = `${currentLead.first_name || ''} ${currentLead.last_name || ''}`.trim() || 'tego leada'
    if (!window.confirm(`Usunąć leada "${name}"? Tej operacji nie można cofnąć.`)) return
    setDeleting(true)
    try {
      await onDelete()
      toast.success('Lead usunięty')
    } catch (err) {
      toast.error(err.message || 'Nie udało się usunąć')
      setDeleting(false)
    }
  }

  const tabs = [
    { key: 'info', label: 'Informacje' },
    { key: 'notes', label: 'Notatki' },
    { key: 'tasks', label: 'Zadania' },
  ]
  if (!isNew) tabs.push({ key: 'activity', label: 'Historia' })

  const showDelete = !isNew && typeof onDelete === 'function'

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
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {isNew ? 'Nowy lead' : `${currentLead?.first_name || ''} ${currentLead?.last_name || ''}`}
              </h3>
              {!isNew && currentLead?.last_contacted_at && (
                <div className="text-xs text-gray-400 mt-0.5">
                  Ostatni kontakt: {formatRelativePl(currentLead.last_contacted_at)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isNew && currentLead?.email && (
                <a
                  href={`mailto:${currentLead.email}`}
                  title="Wyślij email (zapisuje datę kontaktu)"
                  onClick={() => onContact && onContact(currentLead.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >✉</a>
              )}
              {!isNew && currentLead?.phone && (
                <a
                  href={`tel:${currentLead.phone}`}
                  title="Zadzwoń (zapisuje datę kontaktu)"
                  onClick={() => onContact && onContact(currentLead.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >☎</a>
              )}
              {!isNew && currentLead?.website && (
                <a
                  href={currentLead.website.startsWith('http') ? currentLead.website : `https://${currentLead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Otwórz stronę WWW"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >⌘</a>
              )}
              {!isNew && currentLead?.website && (
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief}
                  title="Wygeneruj brief ze strony WWW"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                >{generatingBrief ? '…' : '✨'}</button>
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

          {showDelete && (
            <div className="border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Usuwam…' : '🗑 Usuń leada'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
