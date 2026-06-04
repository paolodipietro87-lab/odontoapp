import { PDFDownloadLink } from '@react-pdf/renderer'
import FatturaPDF from '../../templates/FatturaPDF.jsx'

function slug(s = '') {
  return s.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '')
}

export default function PulsanteScaricaPdf({ fattura }) {
  const numero = (fattura.numeroFormattato ?? '').replace('/', '-')
  const nome = slug(fattura.clienteSnapshot?.denominazione)
  const fileName = `Fattura_${numero}_${nome}.pdf`
  return (
    <PDFDownloadLink
      document={<FatturaPDF fattura={fattura} />}
      fileName={fileName}
      className="mt-4 inline-block bg-blue-600 text-white rounded px-4 py-2"
    >
      {({ loading }) => (loading ? 'Preparo PDF…' : 'Scarica PDF')}
    </PDFDownloadLink>
  )
}
