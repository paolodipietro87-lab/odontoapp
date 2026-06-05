export default function RigaMateriale({ riga, prodotti, onChange, onRemove }) {
  function set(field, value) {
    onChange({ ...riga, [field]: value })
  }
  function onTipo(tipo) {
    const p = prodotti.find((x) => (x.descrizione ?? '') === tipo)
    if (p) {
      onChange({
        ...riga,
        tipo,
        fabbricante: p.produttore ?? '',
        modello: p.descrizione ?? '',
      })
    } else {
      onChange({ ...riga, tipo })
    }
  }
  return (
    <tr className="border-t">
      <td className="p-1"><input list="prodotti-materiale-list" className="border rounded p-1 w-full" value={riga.tipo ?? ''} onChange={(e) => onTipo(e.target.value)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.fabbricante ?? ''} onChange={(e) => set('fabbricante', e.target.value)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.modello ?? ''} onChange={(e) => set('modello', e.target.value)} /></td>
      <td className="p-1"><input className="border rounded p-1 w-full" value={riga.lotto ?? ''} onChange={(e) => set('lotto', e.target.value)} /></td>
      <td className="p-1"><button type="button" className="text-red-600" onClick={onRemove}>✕</button></td>
    </tr>
  )
}
