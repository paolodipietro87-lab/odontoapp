import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#000' },

  header: { textAlign: 'center', marginBottom: 16 },
  labNome: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  labRiga: { fontSize: 8, marginTop: 1 },

  docRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 },
  docLabel: { fontSize: 10 },
  docBox: { borderWidth: 1, borderColor: '#000', paddingVertical: 2, paddingHorizontal: 8, marginHorizontal: 4, fontFamily: 'Helvetica-Bold' },

  boxes: { flexDirection: 'row', marginBottom: 12 },
  box: { flex: 1, borderWidth: 1, borderColor: '#000', padding: 6, marginRight: 8, minHeight: 70 },
  boxLast: { marginRight: 0 },
  boxTitolo: { fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  cfRiga: { marginTop: 8, textDecoration: 'underline' },

  tableHead: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 3, fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 2 },
  cCod: { width: '8%' },
  cDescr: { width: '44%' },
  cQta: { width: '10%', textAlign: 'right' },
  cPrezzo: { width: '13%', textAlign: 'right' },
  cSconto: { width: '8%', textAlign: 'right' },
  cImporto: { width: '13%', textAlign: 'right' },
  cIva: { width: '4%', textAlign: 'right' },

  ivaRecap: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#000', paddingTop: 4, marginTop: 24 },
  ivaRecapCol: { flex: 1 },
  ivaRecapBold: { fontFamily: 'Helvetica-Bold' },

  bottom: { flexDirection: 'row', marginTop: 12 },
  bottomLeft: { flex: 1 },
  bottomRight: { width: '45%' },
  totLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totDoc: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#000', marginTop: 4, paddingTop: 4, fontFamily: 'Helvetica-Bold', fontSize: 12 },

  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerPag: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  footerNote: { width: '85%', fontSize: 6, textAlign: 'right' },
})
