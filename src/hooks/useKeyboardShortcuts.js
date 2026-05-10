import { useEffect } from 'react'

const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Map { key: handler } where key is event.key (e.g. 'n', '/', 'Escape').
 * Skips events when the user is typing into a form field, except for 'Escape'.
 * Handlers receive the event and may call .preventDefault() implicitly via return-true,
 * but by default we always preventDefault when a handler matched.
 */
export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target?.tagName
      const isFormField = FORM_TAGS.has(tag) || e.target?.isContentEditable
      if (isFormField && e.key !== 'Escape') return

      const fn = handlers[e.key]
      if (typeof fn === 'function') {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlers])
}
