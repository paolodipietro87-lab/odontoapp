import { useState } from 'react'
import { parseAnagrafica, dedupByCod } from '../../services/excel.js'
import { importRows } from '../../lib/db/anagrafiche.js'

const KINDS = [
  { value: 'clienti', label: 'Clienti' },
  { value: 'fornitori', label: 'Fornitori' },
  { value: 'prodotti', label: 'Prodotti' },
]

export default function ImportPage() {
  const [kind, setKind] = useState('clienti')
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function onFile(e) {
    setError('')
    setStatus('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const parsed = dedupByCod(parseAnagrafica(buf, kind))
      setRows(parsed)
    } catch (err) {
      setError(`Errore lettura file: ${err.message}`)
      setRows(null)
    }
  }

  async function onConfirm() {
    if (!rows) return
    setStatus('importing')
    try {
      await importRows(kind, rows)
      setStatus('done')
    } catch (err) {
      setError(`Errore import: ${err.message}`)
      setStatus('error')
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Import anagrafiche</h1>

      <label className="block mb-2 text-sm font-medium">Tipo</label>
      <select className="border rounded p-2 mb-4" value={kind}
        onChange={(e) => { setKind(e.target.value); setRows(null); setStatus('') }}>
        {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>

      <label className="block mb-2 text-sm font-medium" htmlFor="file">File Excel (.xlsx)</label>
      <input id="file" type="file" accept=".xlsx" onChange={onFile} className="mb-4 block" />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {rows && (
        <div>
          <p className="mb-2 text-sm text-gray-700">{rows.length} righe pronte all'import</p>
          <div className="border rounded max-h-80 overflow-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{Object.keys(rows[0]).map((c) => <th key={c} className="text-left p-2">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    {Object.keys(rows[0]).map((c) => <td key={c} className="p-2">{String(r[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
            onClick={onConfirm} disabled={status === 'importing'}>
            {status === 'importing' ? 'Import in corso…' : 'Conferma import'}
          </button>
          {status === 'done' && <p className="text-green-700 mt-3">Import completato ✓</p>}
        </div>
      )}
    </div>
  )
}
