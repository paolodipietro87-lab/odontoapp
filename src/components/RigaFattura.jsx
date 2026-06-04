import { importoRiga } from '../utils/calcoli.js'

export default function RigaFattura({ riga, prodotti, onChange, onRemove }) {
  function set(field, raw, numeric) {
    onChange({ ...riga, [field]: numeric ? (raw === '' ? '' : Number(raw)) : raw })
  }
  function onCod(cod) {
    const p = prodotti.find((x) => x.cod === cod)
    if (p) onChange({ ...riga, cod, descrizione: p.descrizione ?? '', um: p.um ?? '', prezzo: p.listino1 ?? 0, iva: 'FC' })
    else onChange({ ...riga, cod })
  }
  function onDescr(descrizione) {
    const p = prodotti.find((x) => (x.descrizione ?? '') === descrizione)
    if (p) onChange({ ...riga, descrizione, cod: p.cod ?? '', um: p.um ?? '', prezzo: p.listino1 ?? 0, iva: 'FC' })
    else onChange({ ...riga, descrizione })
  }
  const importo = importoRiga(riga.qta, riga.prezzo, riga.sconto)
  return (
    <tr className="border-t">
      <td className="p-1">
        <input list="prodotti-list" className="border rounded p-1 w-24" value={riga.cod ?? ''} onChange={(e) => onCod(e.target.value)} />
      </td>
      <td className="p-1"><input list="prodotti-desc-list" className="border rounded p-1 w-full" value={riga.descrizione ?? ''} onChange={(e) => onDescr(e.target.value)} /></td>
      <td className="p-1"><input type="number" step="any" className="border rounded p-1 w-16" value={riga.qta ?? ''} onChange={(e) => set('qta', e.target.value, true)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-12" value={riga.um ?? ''} onChange={(e) => set('um', e.target.value)} /></td>
      <td className="p-1"><input type="number" step="any" className="border rounded p-1 w-20" value={riga.prezzo ?? ''} onChange={(e) => set('prezzo', e.target.value, true)} /></td>
      <td className="p-1"><input type="number" step="any" className="border rounded p-1 w-16" value={riga.sconto ?? ''} onChange={(e) => set('sconto', e.target.value, true)} /></td>
      <td className="p-1 text-right">{importo.toFixed(2)}</td>
      <td className="p-1"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
