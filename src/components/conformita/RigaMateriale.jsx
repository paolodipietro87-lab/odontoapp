import { useMemo } from 'react'
import Autocomplete from '../Autocomplete.jsx'

export default function RigaMateriale({ riga, prodotti, onChange, onRemove }) {
  function set(field, value) {
    onChange({ ...riga, [field]: value })
  }
  function fillFromProdotto(p) {
    onChange({
      ...riga,
      tipo: p.descrizione ?? '',
      fabbricante: p.produttore ?? '',
      modello: p.descrizione ?? '',
    })
  }

  const opts = useMemo(
    () => prodotti.map((p) => ({
      key: p.id,
      label: p.descrizione ?? '',
      detail: [p.cod, p.produttore, p.categoria].filter(Boolean).join(' — '),
      raw: p,
    })),
    [prodotti],
  )

  return (
    <tr className="border-t">
      <td className="p-1 align-top">
        <Autocomplete value={riga.tipo ?? ''} options={opts} onChangeText={(t) => set('tipo', t)} onSelect={(o) => fillFromProdotto(o.raw)} className="border rounded p-1 w-full" />
      </td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-full" value={riga.fabbricante ?? ''} onChange={(e) => set('fabbricante', e.target.value)} /></td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-full" value={riga.modello ?? ''} onChange={(e) => set('modello', e.target.value)} /></td>
      <td className="p-1 align-top"><input className="border rounded p-1 w-full" value={riga.lotto ?? ''} onChange={(e) => set('lotto', e.target.value)} /></td>
      <td className="p-1 align-top"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
