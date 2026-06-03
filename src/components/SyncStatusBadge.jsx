import { useEffect, useState } from 'react'

export default function SyncStatusBadge() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return (
    <span className={`px-2 py-1 rounded text-xs ${online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
