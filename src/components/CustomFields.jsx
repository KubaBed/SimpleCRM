import { useState } from 'react'

export default function CustomFields({ fields = {}, onChange }) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  const add = () => {
    if (!newKey.trim()) return
    onChange({ ...fields, [newKey.trim()]: newValue.trim() })
    setNewKey('')
    setNewValue('')
  }

  const remove = (key) => {
    const updated = { ...fields }
    delete updated[key]
    onChange(updated)
  }

  const updateValue = (key, value) => {
    onChange({ ...fields, [key]: value })
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">Dodatkowe pola</label>
      {Object.entries(fields).map(([key, value]) => (
        <div key={key} className="flex gap-2 mb-2">
          <input value={key} disabled className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          <input
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder="wartość"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          />
          <button type="button" onClick={() => remove(key)} className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="klucz"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="wartość"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
        />
        <button type="button" onClick={add} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Dodaj</button>
      </div>
    </div>
  )
}
