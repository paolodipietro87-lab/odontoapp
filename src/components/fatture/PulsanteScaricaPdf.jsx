import { PDFDownloadLink } from '@react-pdf/renderer'
import FatturaPDF from '../../templates/FatturaPDF.jsx'
import { nomeFileFattura } from '../../utils/condivisione.js'

export default function PulsanteScaricaPdf({ fattura }) {
  return (
    <PDFDownloadLink
      document={<FatturaPDF fattura={fattura} />}
      fileName={nomeFileFattura(fattura)}
      className="inline-block bg-blue-600 text-white rounded px-4 py-2"
    >
      {({ loading }) => (loading ? 'Preparo PDF…' : 'Scarica PDF')}
    </PDFDownloadLink>
  )
}
