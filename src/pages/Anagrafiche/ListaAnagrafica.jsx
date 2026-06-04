import { useEffect, useMemo, useState } from 'react'
import { listAll, deleteOne } from '../../lib/db/anagrafiche.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

export default function ListaAnagrafica({ kind, columns, onEdit }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [toDelete, setToDelete] = useState(null)

  async function load() {
    setLoading(true)
    const data = await listAll(kind)
    setRows(data)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    listAll(kind).then((data) => { if (active) { setRows(data); setLoading(false) } })
    return () => { active = false }
  }, [kind])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      columns.some((c) => String(r[c] ?? '').toLowerCase().includes(needle)))
  }, [rows, q, columns])

  async function confirmDelete() {
    const id = toDelete.id ?? toDelete.cod
    setToDelete(null)
    await deleteOne(kind, id)
    await load()
  }

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
          <tr>
            {columns.map((c) => <th key={c} className="text-left p-2">{c}</th>)}
            <th className="text-right p-2">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              {columns.map((c) => <td key={c} className="p-2">{String(r[c] ?? '')}</td>)}
              <td className="p-2 text-right whitespace-nowrap">
                <button className="text-blue-600 mr-3" onClick={() => onEdit(r)}>Modifica</button>
                <button className="text-red-600" onClick={() => setToDelete(r)}>Elimina</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun risultato.</p>}
      {toDelete && (
        <ConfirmDialog
          message={`Eliminare "${toDelete.denominazione || toDelete.descrizione || toDelete.cod}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
