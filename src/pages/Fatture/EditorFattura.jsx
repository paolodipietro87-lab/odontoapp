import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listAll as listAnagrafica } from '../../lib/db/anagrafiche.js'
import { creaBozza, getOne, aggiornaBozza, deleteBozza } from '../../lib/db/fatture.js'
import { emettiFattura } from '../../services/progressivo.js'
import { calcolaTotali } from '../../utils/calcoli.js'
import ClienteSelect from '../../components/ClienteSelect.jsx'
import RigaFattura from '../../components/RigaFattura.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

const oggi = () => new Date().toISOString().slice(0, 10)
const rigaVuota = () => ({ cod: '', descrizione: '', qta: 1, um: '', prezzo: 0, sconto: 0, iva: 'FC' })

export default function EditorFattura() {
  const { id } = useParams()
  const nav = useNavigate()
  const [fattura, setFattura] = useState({ data: oggi(), clienteId: null, clienteSnapshot: null, righe: [rigaVuota()], pagamento: 'A vista fattura' })
  const [prodotti, setProdotti] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmEmetti, setConfirmEmetti] = useState(false)

  useEffect(() => { listAnagrafica('prodotti').then(setProdotti) }, [])
  useEffect(() => {
    if (id) getOne(id).then((f) => { if (f) setFattura(f) })
  }, [id])

  const totali = useMemo(() => calcolaTotali(fattura.righe), [fattura.righe])
  const setRiga = (i, r) => setFattura((f) => ({ ...f, righe: f.righe.map((x, j) => (j === i ? r : x)) }))
  const addRiga = () => setFattura((f) => ({ ...f, righe: [...f.righe, rigaVuota()] }))
  const removeRiga = (i) => setFattura((f) => ({ ...f, righe: f.righe.filter((_, j) => j !== i) }))

  async function salva() {
    setError(''); setBusy(true)
    try {
      const payload = { ...fattura, ...totali }
      if (id) { await aggiornaBozza(id, payload) }
      else {
        const newId = await creaBozza(payload)
        nav(`/fatture/${newId}/modifica`, { replace: true })
      }
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function salvaSilenzioso() {
    const payload = { ...fattura, ...totali }
    if (id) { await aggiornaBozza(id, payload); return id }
    return creaBozza(payload)
  }

  async function emetti() {
    setConfirmEmetti(false); setError(''); setBusy(true)
    try {
      const fid = await salvaSilenzioso()
      await emettiFattura(fid)
      nav(`/fatture/${fid}`)
    } catch (e) {
      setError('Numerazione richiede connessione internet. La fattura resta in bozza. (' + e.message + ')')
    } finally { setBusy(false) }
  }

  if (fattura.stato === 'emessa') { nav(`/fatture/${id}`, { replace: true }); return null }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-bold mb-4">{id ? 'Modifica bozza' : 'Nuova fattura'}</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <label className="block">Data
          <input type="date" className="border rounded p-2 w-full" value={fattura.data} onChange={(e) => setFattura((f) => ({ ...f, data: e.target.value }))} />
        </label>
        <label className="block">Cliente
          <ClienteSelect value={fattura.clienteId} onChange={(sel) => setFattura((f) => ({ ...f, ...sel }))} />
        </label>
      </div>

      <datalist id="prodotti-list">
        {prodotti.map((p) => <option key={p.id} value={p.cod}>{p.descrizione}</option>)}
      </datalist>
      <datalist id="prodotti-desc-list">
        {prodotti.map((p) => <option key={p.id} value={p.descrizione}>{p.cod}</option>)}
      </datalist>
      <table className="w-full text-sm mb-2">
        <thead className="bg-gray-50"><tr>
          <th className="p-1 text-left">Cod</th><th className="p-1 text-left">Descrizione</th>
          <th className="p-1">Qtà</th><th className="p-1">UM</th><th className="p-1">Prezzo</th>
          <th className="p-1">Sconto%</th><th className="p-1 text-right">Importo</th><th></th>
        </tr></thead>
        <tbody>
          {fattura.righe.map((r, i) => (
            <RigaFattura key={i} riga={r} prodotti={prodotti} onChange={(nr) => setRiga(i, nr)} onRemove={() => removeRiga(i)} />
          ))}
        </tbody>
      </table>
      <button type="button" className="text-blue-600 mb-4" onClick={addRiga}>+ Aggiungi riga</button>

      <div className="text-right mb-4">
        <div>Tot. fuori campo: € {totali.totaleFuoriCampo.toFixed(2)}</div>
        <div>Bollo: € {totali.bollo.toFixed(2)}</div>
        <div className="font-bold">Totale documento: € {totali.totale.toFixed(2)}</div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy} className="bg-gray-100 rounded px-4 py-2" onClick={salva}>Salva bozza</button>
        <button type="button" disabled={busy || !fattura.clienteId} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50" onClick={() => setConfirmEmetti(true)}>Emetti</button>
        {id && <button type="button" disabled={busy} className="text-red-600 ml-auto" onClick={async () => { await deleteBozza(id); nav('/fatture') }}>Elimina bozza</button>}
      </div>
      {confirmEmetti && (
        <ConfirmDialog
          message="Emettere la fattura? Verrà assegnato il numero progressivo definitivo e non sarà più modificabile."
          confirmLabel="Emetti"
          onConfirm={emetti}
          onCancel={() => setConfirmEmetti(false)}
        />
      )}
    </div>
  )
}
