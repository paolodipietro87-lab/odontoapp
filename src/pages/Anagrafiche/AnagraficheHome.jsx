import { Link } from 'react-router-dom'
import ListaAnagrafica from './ListaAnagrafica.jsx'
import { useState } from 'react'

const TABS = [
  { kind: 'clienti', label: 'Clienti', columns: ['cod', 'denominazione', 'citta', 'piva'] },
  { kind: 'fornitori', label: 'Fornitori', columns: ['cod', 'denominazione', 'citta', 'piva'] },
  { kind: 'prodotti', label: 'Prodotti', columns: ['cod', 'descrizione', 'um', 'listino1'] },
]

export default function AnagraficheHome() {
  const [active, setActive] = useState(TABS[0])
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Anagrafiche</h1>
        <Link to="/anagrafiche/import" className="text-sm text-blue-600">Importa da Excel</Link>
      </div>
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.kind} onClick={() => setActive(t)}
            className={`px-3 py-1 rounded text-sm ${active.kind === t.kind ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <ListaAnagrafica key={active.kind} kind={active.kind} columns={active.columns} />
    </div>
  )
}
