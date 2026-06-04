import { useEffect, useMemo, useState } from 'react'
import { listAll } from '../../lib/db/anagrafiche.js'

export default function ListaAnagrafica({ kind, columns }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    listAll(kind).then((data) => {
      if (active) { setRows(data); setLoading(false) }
    })
    return () => { active = false }
  }, [kind])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      columns.some((c) => String(r[c] ?? '').toLowerCase().includes(needle)))
  }, [rows, q, columns])

  if (loading) return <p className="p-6">Caricamento…</p>

  return (
    <div className="p-6">
      <input
        type="text"
        placeholder="Cerca…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded p-2 mb-4 w-full max-w-sm"
      />
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>{columns.map((c) => <th key={c} className="text-left p-2">{c}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              {columns.map((c) => <td key={c} className="p-2">{String(r[c] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun risultato.</p>}
    </div>
  )
}
