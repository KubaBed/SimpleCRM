import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGES } from '../data/pipeline'

export default function BulkToolbar({ count, onMoveToStage, onDelete, onClear }) {
  const [moveOpen, setMoveOpen] = useState(false)

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-3"
        >
          <span className="text-sm font-medium">
            {count} {count === 1 ? 'wybrany' : count < 5 ? 'wybrane' : 'wybranych'}
          </span>
          <span className="w-px h-5 bg-gray-700" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoveOpen((v) => !v)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Przenieś do… ▾
            </button>
            {moveOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                {STAGES.map((stage) => (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => {
                      setMoveOpen(false)
                      onMoveToStage(stage.key)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100"
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 transition-colors"
          >
            🗑 Usuń
          </button>

          <span className="w-px h-5 bg-gray-700" />
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="Anuluj zaznaczenie"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
