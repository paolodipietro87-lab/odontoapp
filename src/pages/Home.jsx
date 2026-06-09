import { Link } from 'react-router-dom'
import SyncStatusBadge from '../components/SyncStatusBadge.jsx'
import { logout } from '../lib/auth.js'
import MagazzinoReminder from '../components/MagazzinoReminder.jsx'

const SEZIONI = [
  { to: '/fatture', label: 'Fatture', desc: 'Crea ed emetti fatture' },
  { to: '/conformita', label: 'Conformità', desc: "Rapportini d'intervento" },
  { to: '/anagrafiche', label: 'Anagrafiche', desc: 'Clienti, fornitori, prodotti' },
  { to: '/magazzino', label: 'Magazzino', desc: 'Giacenze e carico prodotti' },
]

export default function Home() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-blue-700">Ciao Pietro</h1>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <button className="text-sm text-blue-600 underline" onClick={() => logout()}>Esci</button>
        </div>
      </header>
      <MagazzinoReminder />
      <nav className="grid gap-4 sm:grid-cols-2">
        {SEZIONI.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-600 transition"
          >
            <div className="text-lg font-semibold text-blue-700">{s.label}</div>
            <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
          </Link>
        ))}
      </nav>
    </div>
  )
}
