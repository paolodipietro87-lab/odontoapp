import { Link } from 'react-router-dom'
import { useState } from 'react'
import ListaAnagrafica from './ListaAnagrafica.jsx'
import RecordEditor from './RecordEditor.jsx'
import { listColumns } from './schema.js'
import { upsertOne } from '../../lib/db/anagrafiche.js'
import PageHeader from '../../components/PageHeader.jsx'

const TABS = [
  { kind: 'clienti', label: 'Clienti' },
  { kind: 'fornitori', label: 'Fornitori' },
  { kind: 'prodotti', label: 'Prodotti' },
]

export default function AnagraficheHome() {
  const [kind, setKind] = useState('clienti')
  const [editing, setEditing] = useState(undefined) // undefined = list; null = new; object = edit
  const [refreshKey, setRefreshKey] = useState(0)

  function startNew() { setEditing(null) }
  function startEdit(record) { setEditing(record) }
  function cancel() { setEditing(undefined) }

  async function save(values) {
    await upsertOne(kind, values)
    setEditing(undefined)
    setRefreshKey((k) => k + 1)
  }

  const inEditor = editing !== undefined

  return (
    <div className="p-6">
      <PageHeader title="Anagrafiche" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {!inEditor && <button onClick={startNew} className="text-sm bg-blue-600 text-white rounded px-3 py-1">Nuovo</button>}
          <Link to="/anagrafiche/import" className="text-sm text-blue-600">Importa da Excel</Link>
        </div>
      </div>

      {!inEditor && (
        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button key={t.kind} onClick={() => setKind(t.kind)}
              className={`px-3 py-1 rounded text-sm ${kind === t.kind ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {inEditor ? (
        <RecordEditor kind={kind} record={editing} onSave={save} onCancel={cancel} />
      ) : (
        <ListaAnagrafica key={`${kind}-${refreshKey}`} kind={kind} columns={listColumns(kind)} onEdit={startEdit} />
      )}
    </div>
  )
}
