import { PDFDownloadLink } from '@react-pdf/renderer'
import ConformitaPDF from '../../templates/ConformitaPDF.jsx'

function slug(s = '') {
  return s.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
}

export default function PulsanteScaricaPdfConformita({ conformita, intestazione, label }) {
  const data = (conformita.data ?? '').replace(/\//g, '-')
  const paziente = slug(conformita.paziente)
  const suffix = intestazione ? '' : '_paziente'
  const fileName = `Rapporto_${data}_${paziente}${suffix}.pdf`
  return (
    <PDFDownloadLink
      document={<ConformitaPDF conformita={conformita} intestazione={intestazione} />}
      fileName={fileName}
      className="inline-block bg-blue-600 text-white rounded px-4 py-2"
    >
      {({ loading }) => (loading ? 'Preparo PDF…' : label)}
    </PDFDownloadLink>
  )
}
