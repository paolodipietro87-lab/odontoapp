import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LAB } from './lab.js'
import { styles } from './fatturaPdf.styles.js'
import { fatturaToProps } from './fattura.format.js'

const NOTE_1 = 'Ai sensi del D.Lgs. 196/2003 Vi informiamo che i Vs. dati saranno utilizzati esclusivamente per i fini connessi ai rapporti commerciali tra di noi in essere.'
const NOTE_2 = 'Contributo CONAI assolto ove dovuto - Vi preghiamo di controllare i Vs. dati anagrafici, la P. IVA e il Cod. Fiscale. Non ci riteniamo responsabili di eventuali errori.'

function BoxAnagrafica({ titolo, a, last }) {
  return (
    <View style={[styles.box, last && styles.boxLast]}>
      <Text style={styles.boxTitolo}>{titolo}</Text>
      <Text>{a.denominazione}</Text>
      <Text>{a.indirizzo}</Text>
      <Text>{a.cittaRiga}</Text>
      <Text style={styles.cfRiga}>{a.cfPiva}</Text>
    </View>
  )
}

export default function FatturaPDF({ fattura }) {
  const p = fatturaToProps(fattura)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.labNome}>{LAB.nome}</Text>
          <Text style={styles.labRiga}>{LAB.indirizzo}</Text>
          <Text style={styles.labRiga}>{LAB.tel}</Text>
          <Text style={styles.labRiga}>{LAB.cfPiva}</Text>
        </View>

        <View style={styles.docRow}>
          <Text style={styles.docLabel}>Fattura nr.</Text>
          <Text style={styles.docBox}>{p.numero}</Text>
          <Text style={styles.docLabel}>del</Text>
          <Text style={styles.docBox}>{p.data}</Text>
        </View>

        <View style={styles.boxes}>
          <BoxAnagrafica titolo="Destinatario" a={p.destinatario} />
          <BoxAnagrafica titolo="Destinazione" a={p.destinazione} last />
        </View>

        <View style={styles.tableHead}>
          <Text style={styles.cCod}>Codice</Text>
          <Text style={styles.cDescr}>Descrizione</Text>
          <Text style={styles.cQta}>Quantità</Text>
          <Text style={styles.cPrezzo}>Prezzo</Text>
          <Text style={styles.cSconto}>Sconto</Text>
          <Text style={styles.cImporto}>Importo</Text>
          <Text style={styles.cIva}>Iva</Text>
        </View>
        {p.righe.map((r, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.cCod}>{r.cod}</Text>
            <Text style={styles.cDescr}>{r.descrizione}</Text>
            <Text style={styles.cQta}>{r.quantita}</Text>
            <Text style={styles.cPrezzo}>{r.prezzo}</Text>
            <Text style={styles.cSconto}>{r.sconto}</Text>
            <Text style={styles.cImporto}>{r.importo}</Text>
            <Text style={styles.cIva}>{r.iva}</Text>
          </View>
        ))}

        <View style={styles.ivaRecap}>
          <Text style={styles.ivaRecapCol}>FC: Fuori campo IVA</Text>
          <Text style={styles.ivaRecapCol}>Imponibile {p.totali.fuoriCampo}</Text>
          <Text style={styles.ivaRecapCol}>Imposta {p.totali.imposta}</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomLeft}>
            <Text><Text style={styles.ivaRecapBold}>Pagamento: </Text>{p.pagamento}</Text>
            {p.scadenze && <Text><Text style={styles.ivaRecapBold}>Scadenze: </Text>{p.data}   {p.totali.documento}</Text>}
          </View>
          <View style={styles.bottomRight}>
            <View style={styles.totLine}><Text>Tot. imponibile</Text><Text>{p.totali.imponibile}</Text></View>
            <View style={styles.totLine}><Text>Tot. Iva</Text><Text>{p.totali.imposta}</Text></View>
            <View style={styles.totLine}><Text>Tot. importi fuori campo Iva</Text><Text>{p.totali.fuoriCampo}</Text></View>
            <View style={styles.totLine}><Text>Bolli in fattura</Text><Text>{p.totali.bollo}</Text></View>
            <View style={styles.totDoc}><Text>Tot. documento</Text><Text>{p.totali.documento}</Text></View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerPag}>Pag. 1</Text>
          <View style={styles.footerNote}>
            <Text>{NOTE_1}</Text>
            <Text>{NOTE_2}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
