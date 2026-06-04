import { useEffect, useState } from 'react'
import { listAll } from '../lib/db/anagrafiche.js'

const SNAP_FIELDS = ['denominazione', 'indirizzo', 'cap', 'citta', 'prov', 'cf', 'piva']

function toSnapshot(c) {
  const snap = {}
  for (const f of SNAP_FIELDS) snap[f] = c[f] ?? ''
  return snap
}

const labelOf = (c) => c.denominazione || c.cod

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

  function handle(t) {
    setText(t)
    const c = clienti.find((x) => labelOf(x) === t || x.cod === t)
    onChange(
      c
        ? { clienteId: c.id, clienteSnapshot: toSnapshot(c) }
        : { clienteId: null, clienteSnapshot: null },
    )
  }

  return (
    <>
      <input
        list="clienti-list"
        className="border rounded p-2 w-full"
        placeholder="Cerca cliente…"
        value={text}
        onChange={(e) => handle(e.target.value)}
      />
      <datalist id="clienti-list">
        {clienti.map((c) => (
          <option key={c.id} value={labelOf(c)}>
            {c.cod} {c.citta ? `— ${c.citta}` : ''}
          </option>
        ))}
      </datalist>
    </>
  )
}
