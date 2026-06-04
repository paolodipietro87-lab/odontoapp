import { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { getOne } from '../../lib/db/fatture.js'
import PulsanteScaricaPdf from '../../components/fatture/PulsanteScaricaPdf.jsx'

export default function DettaglioFattura() {
  const { id } = useParams()
  const [fattura, setFattura] = useState(undefined)
  useEffect(() => { getOne(id).then(setFattura) }, [id])

  if (fattura === undefined) return <p className="p-6">Caricamento…</p>
  if (fattura === null) return <p className="p-6">Fattura non trovata.</p>
  if (fattura.stato === 'bozza') return <Navigate to={`/fatture/${id}/modifica`} replace />

  const c = fattura.clienteSnapshot ?? {}
  return (
    <div className="p-6 max-w-3xl">
      <Link to="/fatture" className="text-blue-600">← Fatture</Link>
      <h2 className="text-xl font-bold my-3">Fattura {fattura.numeroFormattato}</h2>
      <p>Data: {fattura.data}</p>
      <p className="mt-2 font-medium">{c.denominazione}</p>
      <p className="text-sm text-gray-600">{c.indirizzo} — {c.cap} {c.citta} ({c.prov})</p>
      <p className="text-sm text-gray-600">C.F. {c.cf} · P.IVA {c.piva}</p>
      <table className="w-full text-sm my-4">
        <thead className="bg-gray-50"><tr>
          <th className="text-left p-2">Cod</th><th className="text-left p-2">Descrizione</th>
          <th className="p-2">Qtà</th><th className="p-2">Prezzo</th><th className="text-right p-2">Importo</th>
        </tr></thead>
        <tbody>
          {(fattura.righe ?? []).map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{r.cod}</td><td className="p-2">{r.descrizione}</td>
              <td className="p-2 text-center">{r.qta} {r.um}</td>
              <td className="p-2 text-center">{Number(r.prezzo ?? 0).toFixed(2)}</td>
              <td className="p-2 text-right">{(Number(r.qta) * Number(r.prezzo) * (1 - (Number(r.sconto) || 0) / 100)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right">
        <div>Tot. fuori campo: € {Number(fattura.totaleFuoriCampo ?? 0).toFixed(2)}</div>
        <div>Bollo: € {Number(fattura.bollo ?? 0).toFixed(2)}</div>
        <div className="font-bold">Totale documento: € {Number(fattura.totale ?? 0).toFixed(2)}</div>
      </div>
      <PulsanteScaricaPdf fattura={fattura} />
    </div>
  )
}
