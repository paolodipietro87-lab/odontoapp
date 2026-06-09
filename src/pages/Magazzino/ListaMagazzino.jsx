import { useEffect, useMemo, useState } from 'react'
import { listAll } from '../../lib/db/anagrafiche.js'
import { caricaProdotto } from '../../lib/db/magazzino.js'
import { filtroMagazzino, statoMagazzino } from '../../utils/magazzino.js'
import PageHeader from '../../components/PageHeader.jsx'

function Badge({ stato }) {
  const ok = stato === 'disponibile'
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {ok ? 'Disponibile' : 'Esaurito'}
    </span>
  )
}

export default function ListaMagazzino() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [carica, setCarica] = useState(null) // { cod, descrizione }
  const [qtaCarico, setQtaCarico] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function reload() {
    return listAll('prodotti').then((d) => setRows(filtroMagazzino(d)))
  }
  useEffect(() => { reload().finally(() => setLoading(false)) }, [])

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return rows
    return rows.filter((r) => [r.descrizione, r.cod].some((v) => String(v ?? '').toLowerCase().includes(n)))
  }, [rows, q])

  async function confermaCarico() {
    setError(''); setBusy(true)
    try {
      await caricaProdotto(carica.cod, Number(qtaCarico))
      setCarica(null); setQtaCarico(''); reload()
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  if (loading) return <p className="p-6">Caricamento…</p>
  return (
    <div className="p-6">
      <PageHeader title="Magazzino" />
      <div className="flex items-center gap-3 mb-4">
        <input className="border rounded p-2 ml-auto w-64" placeholder="Cerca descrizione/codice…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Descrizione</th><th className="text-left p-2">Cod.</th>
          <th className="text-left p-2">Categoria</th><th className="text-left p-2">Sottocategoria</th>
          <th className="text-left p-2">Stato</th><th className="text-right p-2">Disponibile</th><th></th>
        </tr></thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2 font-bold">{r.descrizione}</td>
              <td className="p-2">{r.cod}</td>
              <td className="p-2">{r.categoria}</td>
              <td className="p-2">{r.sottocategoria}</td>
              <td className="p-2"><Badge stato={statoMagazzino(r.qtaDisponibile)} /></td>
              <td className="p-2 text-right">{r.qtaDisponibile ?? 0}</td>
              <td className="p-2"><button type="button" className="text-blue-600" onClick={() => { setCarica(r); setQtaCarico(''); setError('') }}>Carica</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-gray-500 mt-4">Nessun prodotto a magazzino.</p>}

      {carica && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <p className="mb-1 font-medium">Carica magazzino</p>
            <p className="mb-3 text-sm text-gray-600">{carica.descrizione} ({carica.cod})</p>
            <input type="number" step="any" min="0" autoFocus className="border rounded p-2 w-full mb-2" placeholder="Quantità da aggiungere" value={qtaCarico} onChange={(e) => setQtaCarico(e.target.value)} />
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-1 rounded bg-gray-100" onClick={() => setCarica(null)}>Annulla</button>
              <button type="button" disabled={busy || !(Number(qtaCarico) > 0)} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50" onClick={confermaCarico}>Carica</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
