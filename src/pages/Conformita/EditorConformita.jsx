import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listAll as listAnagrafica } from '../../lib/db/anagrafiche.js'
import { crea, getOne, aggiorna, elimina } from '../../lib/db/conformita.js'
import ClienteSelect from '../../components/ClienteSelect.jsx'
import RigaMateriale from '../../components/conformita/RigaMateriale.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import PageHeader from '../../components/PageHeader.jsx'

const materialeVuoto = () => ({ tipo: '', fabbricante: '', modello: '', lotto: '' })
const vuota = () => ({
  data: '', dataConsegna: '', prescrizioneMedicaDel: '',
  clienteId: null, clienteSnapshot: null, paziente: '',
  descrizioneDispositivo: '', terminiUtilizzazione: '',
  avvertenze: '', prodottiConsigliati: '', noteParticolari: '',
  materiali: [materialeVuoto()],
})

export default function EditorConformita() {
  const { id } = useParams()
  const nav = useNavigate()
  const [doc, setDoc] = useState(vuota())
  const [prodotti, setProdotti] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => { listAnagrafica('prodotti').then(setProdotti) }, [])
  useEffect(() => { if (id) getOne(id).then((d) => { if (d) setDoc(d) }) }, [id])

  const set = (field, value) => setDoc((d) => ({ ...d, [field]: value }))
  const setMateriale = (i, m) => setDoc((d) => ({ ...d, materiali: d.materiali.map((x, j) => (j === i ? m : x)) }))
  const addMateriale = () => setDoc((d) => ({ ...d, materiali: [...d.materiali, materialeVuoto()] }))
  const removeMateriale = (i) => setDoc((d) => ({ ...d, materiali: d.materiali.filter((_, j) => j !== i) }))

  async function salva() {
    setError(''); setBusy(true)
    try {
      if (id) { await aggiorna(id, doc); nav(`/conformita/${id}`) }
      else {
        const newId = await crea(doc)
        nav(`/conformita/${newId}`)
      }
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title={id ? 'Modifica rapportino' : 'Nuovo rapportino'} />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <label className="block">Medico prescrivente
          <ClienteSelect value={doc.clienteId} onChange={(sel) => setDoc((d) => ({ ...d, ...sel }))} />
        </label>
        <label className="block">Paziente
          <input className="border rounded p-2 w-full" value={doc.paziente} onChange={(e) => set('paziente', e.target.value)} />
        </label>
        <label className="block">Descrizione dispositivo
          <input className="border rounded p-2 w-full" value={doc.descrizioneDispositivo} onChange={(e) => set('descrizioneDispositivo', e.target.value)} />
        </label>
        <label className="block">Prescrizione medica del
          <input className="border rounded p-2 w-full" value={doc.prescrizioneMedicaDel} onChange={(e) => set('prescrizioneMedicaDel', e.target.value)} />
        </label>
        <label className="block">Data
          <input className="border rounded p-2 w-full" value={doc.data} onChange={(e) => set('data', e.target.value)} />
        </label>
        <label className="block">Data consegna
          <input className="border rounded p-2 w-full" value={doc.dataConsegna} onChange={(e) => set('dataConsegna', e.target.value)} />
        </label>
        <label className="block">Termini per l'utilizzazione (giorni)
          <input className="border rounded p-2 w-full" value={doc.terminiUtilizzazione} onChange={(e) => set('terminiUtilizzazione', e.target.value)} />
        </label>
        <label className="block">Avvertenze
          <input className="border rounded p-2 w-full" value={doc.avvertenze} onChange={(e) => set('avvertenze', e.target.value)} />
        </label>
        <label className="block">Prodotti consigliati
          <input className="border rounded p-2 w-full" value={doc.prodottiConsigliati} onChange={(e) => set('prodottiConsigliati', e.target.value)} />
        </label>
        <label className="block">Note particolari
          <input className="border rounded p-2 w-full" value={doc.noteParticolari} onChange={(e) => set('noteParticolari', e.target.value)} />
        </label>
      </div>

      <datalist id="prodotti-materiale-list">
        {prodotti.map((p) => <option key={p.id} value={p.descrizione}>{p.cod}</option>)}
      </datalist>
      <h3 className="font-bold mb-2">Materiali</h3>
      <table className="w-full text-sm mb-2">
        <thead className="bg-gray-50"><tr>
          <th className="p-1 text-left">Tipo</th><th className="p-1 text-left">Fabbricante</th>
          <th className="p-1 text-left">Modello</th><th className="p-1 text-left">Lotto</th><th></th>
        </tr></thead>
        <tbody>
          {doc.materiali.map((m, i) => (
            <RigaMateriale key={i} riga={m} prodotti={prodotti} onChange={(nm) => setMateriale(i, nm)} onRemove={() => removeMateriale(i)} />
          ))}
        </tbody>
      </table>
      <button type="button" className="text-blue-600 mb-4" onClick={addMateriale}>+ Aggiungi materiale</button>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50" onClick={salva}>Salva</button>
        {id && <button type="button" disabled={busy} className="text-red-600 ml-auto" onClick={() => setConfirmDelete(true)}>Elimina</button>}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message="Eliminare questo rapportino?"
          confirmLabel="Elimina"
          onConfirm={async () => { await elimina(id); nav('/conformita') }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
