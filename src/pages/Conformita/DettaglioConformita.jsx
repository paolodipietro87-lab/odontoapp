import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOne } from '../../lib/db/conformita.js'
import PulsanteScaricaPdfConformita from '../../components/conformita/PulsanteScaricaPdfConformita.jsx'

export default function DettaglioConformita() {
  const { id } = useParams()
  const [doc, setDoc] = useState(undefined)
  useEffect(() => { getOne(id).then(setDoc) }, [id])

  if (doc === undefined) return <p className="p-6">Caricamento…</p>
  if (doc === null) return <p className="p-6">Rapportino non trovato.</p>

  const c = doc.clienteSnapshot ?? {}
  return (
    <div className="p-6 max-w-3xl">
      <Link to="/conformita" className="text-blue-600">← Conformità</Link>
      <h2 className="text-xl font-bold my-3">Rapportino — {doc.paziente}</h2>
      <p>Data: {doc.data} · Consegna: {doc.dataConsegna}</p>
      <p className="mt-2">Dispositivo: {doc.descrizioneDispositivo}</p>
      <p className="mt-2 font-medium">{c.denominazione}</p>
      <p className="text-sm text-gray-600">{c.indirizzo} — {c.cap} {c.citta} ({c.prov})</p>
      <table className="w-full text-sm my-4">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Tipo</th><th className="text-left p-2">Fabbricante</th>
          <th className="text-left p-2">Modello</th><th className="text-left p-2">Lotto</th>
        </tr></thead>
        <tbody>
          {(doc.materiali ?? []).map((m, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{m.tipo}</td><td className="p-2">{m.fabbricante}</td>
              <td className="p-2">{m.modello}</td><td className="p-2">{m.lotto}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-3 items-center">
        <PulsanteScaricaPdfConformita conformita={doc} intestazione label="Scarica PDF (per medico)" />
        <PulsanteScaricaPdfConformita conformita={doc} intestazione={false} label="Scarica PDF (per paziente)" />
        <Link to={`/conformita/${id}/modifica`} className="text-blue-600 ml-auto">Modifica</Link>
      </div>
    </div>
  )
}
