import { Document, Page, View, Text } from '@react-pdf/renderer'
import { LAB } from './lab.js'
import { styles } from './conformitaPdf.styles.js'
import { conformitaToProps } from './conformita.format.js'
import {
  BULLET_CONSERVAZIONE, DICHIARAZIONE,
  ISTRUZIONI_TITOLO, ISTRUZIONI_SOTTOTITOLO, ISTRUZIONI_INTRO, ISTRUZIONI_NUMERATE,
  ISTRUZIONI_RESPONSABILITA, ISTRUZIONI_EFFETTI, ISTRUZIONI_AVVERTENZE_TITOLO,
  ISTRUZIONI_AVVERTENZE, ISTRUZIONI_NOTA, FOOTER_FIRMA_SX, FOOTER_FIRMA_DX,
} from './conformita.fixed.js'

function LabHeader() {
  return (
    <View style={styles.labHeader}>
      <Text style={styles.labNome}>{LAB.nome}</Text>
      <Text style={styles.labNomeUpper}>{LAB.nomeUpper}</Text>
      <Text style={styles.labRiga}>{LAB.indirizzo}</Text>
      <Text style={styles.labRiga}>{LAB.tel}</Text>
      <Text style={styles.labRiga}>{LAB.cfPiva}</Text>
    </View>
  )
}

function BoxDichiarazione({ p }) {
  return (
    <View style={styles.boxCol}>
      <Text style={styles.boxTitolo}>DICHIARAZIONE DEL FABBRICANTE</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Data: </Text>{p.data}    <Text style={styles.bold}>Data consegna: </Text>{p.dataConsegna}</Text>
      <Text style={[styles.bold, styles.rigaSpazio]}>Descrizione del dispositivo:</Text>
      <Text style={styles.riga}>{p.descrizioneDispositivo}</Text>
      <View style={styles.rigaSpazio}>
        <Text><Text style={styles.bold}>Prescrivente: </Text>{p.prescrivente.denominazione}</Text>
        <Text>{p.prescrivente.indirizzo}</Text>
        <Text>{p.prescrivente.cittaRiga}</Text>
        <Text style={styles.underline}>{p.prescrivente.cfPiva}</Text>
      </View>
      <Text style={styles.rigaSpazio}>Con riferimento alla Vs. prescrizione riguardante il/la Sig./sig.ra:</Text>
      <Text style={styles.bold}>{p.paziente}</Text>
      <View style={styles.rigaSpazio}>
        {DICHIARAZIONE.map((t, i) => <Text key={i} style={styles.riga}>{t}</Text>)}
      </View>
    </View>
  )
}

function BoxEtichettatura({ p }) {
  return (
    <View style={[styles.boxCol, styles.boxColSep]}>
      <Text style={styles.boxTitolo}>ETICHETTATURA</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Cognome e Nome: </Text>{p.paziente}</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Prescrizione medica del: </Text>{p.prescrizioneMedicaDel}</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Data consegna: </Text>{p.dataConsegna}</Text>
      <Text style={styles.riga}><Text style={styles.bold}>Dispositivo: </Text>{p.descrizioneDispositivo}</Text>
      <Text style={styles.rigaSpazio}>Codice          Identificativo n.</Text>
      <Text>Condizioni specifiche di conservazione e manipolazione</Text>
      {BULLET_CONSERVAZIONE.map((b, i) => <Text key={i} style={styles.bullet}>• {b}</Text>)}
      <Text style={styles.riga}>Termini per l'utilizzazione: {p.terminiUtilizzazione} giorni</Text>
      <Text style={styles.sezioneTitolo}>CONSERVAZIONE E MANIPOLAZIONE:</Text>
      <Text style={styles.riga}>Avvertenze: {p.avvertenze}</Text>
      <Text style={styles.riga}>Prodotti consigliati per pulizia e manutenzione: {p.prodottiConsigliati}</Text>
      <Text style={styles.riga}>Note particolari per la eventuale attivazione: {p.noteParticolari}</Text>
    </View>
  )
}

function TabellaMateriali({ materiali }) {
  return (
    <View>
      <View style={styles.tableHead}>
        <Text style={styles.cTipo}>Tipo</Text>
        <Text style={styles.cFabbricante}>Fabbricante</Text>
        <Text style={styles.cModello}>Modello</Text>
        <Text style={styles.cLotto}>Lotto</Text>
      </View>
      {materiali.map((m, i) => (
        <View style={styles.tableRow} key={i}>
          <Text style={styles.cTipo}>{m.tipo}</Text>
          <Text style={styles.cFabbricante}>{m.fabbricante}</Text>
          <Text style={styles.cModello}>{m.modello}</Text>
          <Text style={styles.cLotto}>{m.lotto}</Text>
        </View>
      ))}
    </View>
  )
}

function Istruzioni() {
  return (
    <View>
      <Text style={styles.istrTitolo}>{ISTRUZIONI_TITOLO} <Text style={{ fontFamily: 'Helvetica' }}>{ISTRUZIONI_SOTTOTITOLO}</Text></Text>
      <Text style={styles.istrPar}>{ISTRUZIONI_INTRO}</Text>
      {ISTRUZIONI_NUMERATE.map((t, i) => <Text key={i} style={styles.istrItem}>{t}</Text>)}
      <Text style={styles.istrPar}>{ISTRUZIONI_RESPONSABILITA}</Text>
      {ISTRUZIONI_EFFETTI.map((t, i) => <Text key={i} style={styles.istrBullet}>- {t}</Text>)}
      <Text style={styles.istrPar}>{ISTRUZIONI_AVVERTENZE_TITOLO}</Text>
      {ISTRUZIONI_AVVERTENZE.map((t, i) => <Text key={i} style={styles.istrBullet}>- {t}</Text>)}
      <Text style={styles.istrItem}>{ISTRUZIONI_NOTA}</Text>
    </View>
  )
}

export default function ConformitaPDF({ conformita, intestazione = true }) {
  const p = conformitaToProps(conformita)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {intestazione && <LabHeader />}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.ministero}>N° MINISTERO DELLA SANITA'</Text>
            <Text style={styles.ministeroNum}>{LAB.ministero}</Text>
          </View>
          <Text style={styles.rea}>R.E.A {LAB.rea}</Text>
        </View>
        <View style={styles.boxes}>
          <BoxDichiarazione p={p} />
          <BoxEtichettatura p={p} />
        </View>
        <TabellaMateriali materiali={p.materiali} />
        <Istruzioni />
        <View style={styles.firme}>
          <Text>{FOOTER_FIRMA_SX}</Text>
          <Text>{FOOTER_FIRMA_DX}</Text>
        </View>
      </Page>
    </Document>
  )
}
