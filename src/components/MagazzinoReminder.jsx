import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAll } from '../lib/db/anagrafiche.js'
import { filtroMagazzino, statoMagazzino } from '../utils/magazzino.js'

export default function MagazzinoReminder() {
  const [esauriti, setEsauriti] = useState([])

  useEffect(() => {
    listAll('prodotti').then((d) => {
      setEsauriti(filtroMagazzino(d).filter((p) => statoMagazzino(p.qtaDisponibile) === 'esaurito'))
    }).catch(() => {})
  }, [])

  if (esauriti.length === 0) return null
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-800 mb-1">Prodotti esauriti ({esauriti.length})</p>
      <p className="text-sm text-red-700">{esauriti.slice(0, 8).map((p) => p.descrizione || p.cod).join(', ')}{esauriti.length > 8 ? '…' : ''}</p>
      <Link to="/magazzino" className="text-sm text-red-800 underline">Vai al magazzino</Link>
    </div>
  )
}
