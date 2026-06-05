import { useNavigate, Link } from 'react-router-dom'

// Header riusabile: pulsante Indietro (history -1) + Home, titolo opzionale.
export default function PageHeader({ title, children }) {
  const nav = useNavigate()
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => nav(-1)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
      >← Indietro</button>
      <Link
        to="/"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
      >🏠 Home</Link>
      {title && <h2 className="text-lg font-bold ml-2">{title}</h2>}
      {children}
    </div>
  )
}
