// Formatter puri per il PDF conformità. Niente JSX → unit-testabile.

function anagraficaToProps(a = {}) {
  return {
    denominazione: a.denominazione ?? '',
    indirizzo: a.indirizzo ?? '',
    cittaRiga: `${a.cap ?? ''} ${a.citta ?? ''} (${a.prov ?? ''})`.trim(),
    cfPiva: `C.F. ${a.cf ?? ''}   P.Iva ${a.piva ?? ''}`,
  }
}

export function pulisciMateriali(materiali = []) {
  return (materiali ?? [])
    .map((m) => ({
      tipo: m.tipo ?? '',
      fabbricante: m.fabbricante ?? '',
      modello: m.modello ?? '',
      lotto: m.lotto ?? '',
    }))
    .filter((m) => m.tipo || m.fabbricante || m.modello || m.lotto)
}

export function conformitaToProps(doc) {
  return {
    data: doc.data ?? '',
    dataConsegna: doc.dataConsegna ?? '',
    prescrizioneMedicaDel: doc.prescrizioneMedicaDel ?? '',
    paziente: (doc.paziente ?? '').trim(),
    descrizioneDispositivo: doc.descrizioneDispositivo ?? '',
    terminiUtilizzazione: doc.terminiUtilizzazione ?? '',
    avvertenze: doc.avvertenze ?? '',
    prodottiConsigliati: doc.prodottiConsigliati ?? '',
    noteParticolari: doc.noteParticolari ?? '',
    prescrivente: anagraficaToProps(doc.clienteSnapshot ?? {}),
    materiali: pulisciMateriali(doc.materiali),
  }
}
