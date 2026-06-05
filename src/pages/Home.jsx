import { Link } from 'react-router-dom'
import SyncStatusBadge from '../components/SyncStatusBadge.jsx'
import { logout } from '../lib/auth.js'

export default function Home() {
  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">OdontoApp</h1>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <button className="text-sm text-blue-600" onClick={() => logout()}>Esci</button>
        </div>
      </header>
      <nav className="flex gap-4">
        <Link to="/fatture" className="text-blue-600">Fatture</Link>
        <Link to="/conformita" className="text-blue-600">Conformità</Link>
        <Link to="/anagrafiche" className="text-blue-600">Anagrafiche</Link>
      </nav>
    </div>
  )
}
