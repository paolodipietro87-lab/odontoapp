import { useEffect, useMemo, useState } from 'react'
import { listAll } from '../lib/db/anagrafiche.js'
import Autocomplete from './Autocomplete.jsx'

const SNAP_FIELDS = ['denominazione', 'indirizzo', 'cap', 'citta', 'prov', 'cf', 'piva']

function toSnapshot(c) {
  const snap = {}
  for (const f of SNAP_FIELDS) snap[f] = c[f] ?? ''
  return snap
}

const labelOf = (c) => c.denominazione || c.cod

function detailOf(c) {
  const luogo = [c.indirizzo, [c.cap, c.citta].filter(Boolean).join(' '), c.prov && `(${c.prov})`]
    .filter(Boolean)
    .join(', ')
  const piva = c.piva ? `P.IVA ${c.piva}` : c.cf ? `C.F. ${c.cf}` : ''
  return [c.cod, luogo, piva].filter(Boolean).join(' — ')
}

export default function ClienteSelect({ value, onChange }) {
  const [clienti, setClienti] = useState([])
  const [text, setText] = useState('')

  useEffect(() => { listAll('clienti').then(setClienti) }, [])

  // Sync the displayed text when value (clienteId) is set externally (loading a draft)
  useEffect(() => {
    if (!value) return
    const c = clienti.find((x) => x.id === value)
    if (c) setText(labelOf(c))
  }, [value, clienti])

  const options = useMemo(
    () => clienti.map((c) => ({ key: c.id, label: labelOf(c), detail: detailOf(c), raw: c })),
    [clienti],
  )

  function onSelect(opt) {
    const c = opt.raw
    setText(labelOf(c))
    onChange({ clienteId: c.id, clienteSnapshot: toSnapshot(c) })
  }

  function onChangeText(t) {
    setText(t)
    // Free typing without a pick = no cliente selezionato (impedisce snapshot incoerenti)
    onChange({ clienteId: null, clienteSnapshot: null })
  }

  return (
    <Autocomplete
      value={text}
      onChangeText={onChangeText}
      onSelect={onSelect}
      options={options}
      placeholder="Cerca cliente…"
    />
  )
}
