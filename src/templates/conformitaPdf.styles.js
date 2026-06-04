import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 30, paddingHorizontal: 28, fontSize: 8, fontFamily: 'Helvetica', color: '#000' },

  // Header laboratorio (solo versione CON intestazione)
  labHeader: { textAlign: 'center', marginBottom: 4 },
  labNome: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  labNomeUpper: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  labRiga: { fontSize: 7 },

  // Riga Ministero / REA
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  ministero: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  ministeroNum: { fontFamily: 'Helvetica-Bold', fontSize: 8, marginLeft: 16 },
  rea: { borderWidth: 1, borderColor: '#000', paddingVertical: 3, paddingHorizontal: 6, fontFamily: 'Helvetica-Bold' },

  // Box affiancati Dichiarazione | Etichettatura
  boxes: { flexDirection: 'row', borderWidth: 1, borderColor: '#000' },
  boxCol: { flex: 1, padding: 5 },
  boxColSep: { borderLeftWidth: 1, borderLeftColor: '#000' },
  boxTitolo: { fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  riga: { marginBottom: 2 },
  rigaSpazio: { marginTop: 6 },
  underline: { textDecoration: 'underline' },
  bullet: { marginLeft: 8 },
  sezioneTitolo: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginTop: 6 },

  // Tabella materiali
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 3, marginTop: 8, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 1 },
  cTipo: { width: '30%' },
  cFabbricante: { width: '28%' },
  cModello: { width: '20%' },
  cLotto: { width: '22%' },

  // Istruzioni d'uso
  istrTitolo: { fontFamily: 'Helvetica-Bold', textDecoration: 'underline', marginTop: 12, fontSize: 8 },
  istrPar: { marginTop: 4, fontSize: 7, lineHeight: 1.3 },
  istrItem: { marginTop: 2, fontSize: 7, lineHeight: 1.3 },
  istrBullet: { marginTop: 2, marginLeft: 8, fontSize: 7, lineHeight: 1.3 },

  // Footer firme
  firme: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, fontSize: 8 },
})
