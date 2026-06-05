import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { puoCondividereFile } from '../utils/condivisione.js'

// Genera il PDF in memoria e apre il menu di condivisione nativo del dispositivo.
// Se il dispositivo non supporta la condivisione di file (es. molti desktop),
// ripiega sul download del file.
export default function PulsanteCondividiPdf({ document, fileName, label = 'Condividi' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function condividi() {
    setError(''); setBusy(true)
    try {
      const blob = await pdf(document).toBlob()
      const file = new File([blob], fileName, { type: 'application/pdf' })
      if (puoCondividereFile(navigator, file)) {
        await navigator.share({ files: [file], title: fileName })
      } else {
        // fallback: download
        const url = URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      // AbortError = utente ha chiuso il menu condivisione: non è un errore.
      if (e?.name !== 'AbortError') setError('Condivisione non riuscita.')
    } finally { setBusy(false) }
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={busy}
        onClick={condividi}
        className="inline-block bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >{busy ? 'Preparo…' : label}</button>
      {error && <span className="text-red-600 text-xs mt-1">{error}</span>}
    </span>
  )
}
