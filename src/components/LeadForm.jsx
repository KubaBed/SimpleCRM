import { useState } from 'react'
import CustomFields from './CustomFields'
import { STAGES } from '../data/pipeline'

const SOURCES = ['LinkedIn', 'Polecenie', 'Strona WWW', 'Email', 'Inne']

export default function LeadForm({ lead, onSave, isNew }) {
  const [form, setForm] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company_name: lead?.company_name || '',
    website: lead?.website || '',
    industry: lead?.industry || '',
    company_size: lead?.company_size || '',
    source: lead?.source || '',
    stage: lead?.stage || 'nowy',
    estimated_value: lead?.estimated_value || '',
    offer_value: lead?.offer_value || '',
    won_value: lead?.won_value || '',
    custom_fields: lead?.custom_fields || {}
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      offer_value: form.offer_value ? Number(form.offer_value) : null,
      won_value: form.won_value ? Number(form.won_value) : null,
    }
    onSave(data)
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Imię *</label>
          <input name="first_name" value={form.first_name} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nazwisko</label>
          <input name="last_name" value={form.last_name} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Telefon</label>
        <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Firma</label>
        <input name="company_name" value={form.company_name} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Strona WWW</label>
        <input
          name="website"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={form.website}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Branża</label>
          <input name="industry" value={form.industry} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Wielkość firmy</label>
          <select name="company_size" value={form.company_size} onChange={handleChange} className={inputClass}>
            <option value="">—</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201+">201+</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Źródło</label>
          <select name="source" value={form.source} onChange={handleChange} className={inputClass}>
            <option value="">—</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Etap</label>
          <select name="stage" value={form.stage} onChange={handleChange} className={inputClass}>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Szac. wartość</label>
          <input name="estimated_value" type="number" value={form.estimated_value} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Kwota oferty</label>
          <input name="offer_value" type="number" value={form.offer_value} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Wygrana</label>
          <input name="won_value" type="number" value={form.won_value} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <CustomFields
        fields={form.custom_fields}
        onChange={(custom_fields) => setForm(prev => ({ ...prev, custom_fields }))}
      />

      <button type="submit" className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
        {isNew ? 'Utwórz lead' : 'Zapisz'}
      </button>
    </form>
  )
}
