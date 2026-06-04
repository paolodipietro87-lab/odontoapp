import { useState } from 'react'
import { FIELDS, emptyRecord } from './schema.js'

export default function RecordEditor({ kind, record, onSave, onCancel }) {
  const isEdit = record != null
  const [values, setValues] = useState(() => ({ ...emptyRecord(kind), ...(record ?? {}) }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function setField(name, raw, type) {
    const value = type === 'number' ? (raw === '' ? null : Number(raw)) : raw
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!String(values.cod ?? '').trim()) {
      setError('Codice obbligatorio')
      return
    }
    setSaving(true)
    try {
      await onSave(values)
    } catch (err) {
      setError(err.message || 'Errore salvataggio')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-6 max-w-lg">
      <h2 className="text-lg font-bold mb-4">{isEdit ? 'Modifica' : 'Nuovo'} record</h2>
      {FIELDS[kind].map((f) => (
        <div key={f.name} className="mb-3">
          <label className="block text-sm font-medium mb-1" htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            type={f.type === 'number' ? 'number' : 'text'}
            step={f.type === 'number' ? 'any' : undefined}
            className="border rounded p-2 w-full disabled:bg-gray-100"
            disabled={f.name === 'cod' && isEdit}
            value={values[f.name] ?? ''}
            onChange={(e) => setField(f.name, e.target.value, f.type)}
          />
        </div>
      ))}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-100 rounded px-4 py-2">Annulla</button>
      </div>
    </form>
  )
}
