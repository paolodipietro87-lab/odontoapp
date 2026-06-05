import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAll } from '../../lib/db/conformita.js'

export default function ListaConformita() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { listAll().then((d) => { setRows(d); setLoading(false) }) }, [])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) =>
      [r.paziente, r.data, r.clienteSnapshot?.denominazione]
        .some((v) => String(v ?? '').toLowerCase().includes(n)))
  }, [rows, q])

  if (loading) return <p className="p-6">Caricamento…</p>
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Conformità</h2>
        <Link to="/conformita/nuova" className="bg-blue-600 text-white rounded px-3 py-1">Nuovo</Link>
        <input className="border rounded p-2 ml-auto w-64" placeholder="Cerca paziente/data…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Data</th><th className="text-left p-2">Paziente</th>
          <th className="text-left p-2">Dispositivo</th><th className="text-left p-2">Medico</th>
        </tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2"><Link className="text-blue-600" to={`/conformita/${r.id}`}>{r.data || '—'}</Link></td>
              <td className="p-2">{r.paziente}</td>
              <td className="p-2">{r.descrizioneDispositivo}</td>
              <td className="p-2">{r.clienteSnapshot?.denominazione ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun rapportino.</p>}
    </div>
  )
}
