import { PDFDownloadLink } from '@react-pdf/renderer'
import ConformitaPDF from '../../templates/ConformitaPDF.jsx'
import { nomeFileConformita } from '../../utils/condivisione.js'

export default function PulsanteScaricaPdfConformita({ conformita, intestazione, label }) {
  return (
    <PDFDownloadLink
      document={<ConformitaPDF conformita={conformita} intestazione={intestazione} />}
      fileName={nomeFileConformita(conformita, intestazione)}
      className="inline-block bg-blue-600 text-white rounded px-4 py-2"
    >
      {({ loading }) => (loading ? 'Preparo PDF…' : label)}
    </PDFDownloadLink>
  )
}
