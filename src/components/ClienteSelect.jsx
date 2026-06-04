import { useEffect, useState } from 'react'
import { listAll } from '../lib/db/anagrafiche.js'

const SNAP_FIELDS = ['denominazione', 'indirizzo', 'cap', 'citta', 'prov', 'cf', 'piva']

function toSnapshot(c) {
  const snap = {}
  for (const f of SNAP_FIELDS) snap[f] = c[f] ?? ''
  return snap
}

export default function ClienteSelect({ value, onChange }) {
  const [clienti, setClienti] = useState([])
  useEffect(() => { listAll('clienti').then(setClienti) }, [])
  return (
    <select
      className="border rounded p-2 w-full"
      value={value ?? ''}
      onChange={(e) => {
        const c = clienti.find((x) => x.id === e.target.value)
        onChange(c ? { clienteId: c.id, clienteSnapshot: toSnapshot(c) } : { clienteId: null, clienteSnapshot: null })
      }}
    >
      <option value="">— Seleziona cliente —</option>
      {clienti.map((c) => (
        <option key={c.id} value={c.id}>{c.denominazione || c.cod}</option>
      ))}
    </select>
  )
}
