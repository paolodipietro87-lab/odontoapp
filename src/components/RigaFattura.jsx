import { useMemo } from 'react'
import { importoRiga } from '../utils/calcoli.js'
import Autocomplete from './Autocomplete.jsx'

const prezzoLabel = (p) => (p.listino1 != null && p.listino1 !== '' ? `€ ${p.listino1}` : '')

export default function RigaFattura({ riga, prodotti, onChange, onRemove }) {
  function set(field, raw, numeric) {
    onChange({ ...riga, [field]: numeric ? (raw === '' ? '' : Number(raw)) : raw })
  }
  function fillFromProdotto(p) {
    onChange({ ...riga, cod: p.cod ?? '', descrizione: p.descrizione ?? '', um: p.um ?? '', prezzo: p.listino1 ?? 0, iva: 'FC' })
  }

  const optsCod = useMemo(
    () => prodotti.map((p) => ({ key: p.id, label: p.cod ?? '', detail: [p.descrizione, p.produttore, p.categoria, prezzoLabel(p)].filter(Boolean).join(' — '), raw: p })),
    [prodotti],
  )
  const optsDesc = useMemo(
    () => prodotti.map((p) => ({ key: p.id, label: p.descrizione ?? '', detail: [p.cod, p.produttore, p.categoria, prezzoLabel(p)].filter(Boolean).join(' — '), raw: p })),
    [prodotti],
  )

  const importo = importoRiga(riga.qta, riga.prezzo, riga.sconto)
  return (
    <tr className="border-t">
      <td className="p-1 align-top">
        <Autocomplete value={riga.cod ?? ''} options={optsCod} onChangeText={(t) => set('cod', t)} onSelect={(o) => fillFromProdotto(o.raw)} className="border rounded p-1 w-24" />
      </td>
      <td className="p-1 align-top">
        <Autocomplete value={riga.descrizione ?? ''} options={optsDesc} onChangeText={(t) => set('descrizione', t)} onSelect={(o) => fillFromProdotto(o.raw)} className="border rounded p-1 w-full" />
      </td>
      <td className="p-1 align-top"><input type="number" step="any" className="border rounded p-1 w-16" value={riga.qta ?? ''} onChange={(e) => set('qta', e.target.value, true)} /></td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-12" value={riga.um ?? ''} onChange={(e) => set('um', e.target.value)} /></td>
      <td className="p-1 align-top"><input type="number" step="any" className="border rounded p-1 w-20" value={riga.prezzo ?? ''} onChange={(e) => set('prezzo', e.target.value, true)} /></td>
      <td className="p-1 align-top"><input type="number" step="any" className="border rounded p-1 w-16" value={riga.sconto ?? ''} onChange={(e) => set('sconto', e.target.value, true)} /></td>
      <td className="p-1 text-right align-top">{importo.toFixed(2)}</td>
      <td className="p-1 align-top"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
