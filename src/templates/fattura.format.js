// Formatter puri per il PDF fattura. Niente JSX qui → tutto unit-testabile.

const eurFmt = (decimali) => new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: decimali, maximumFractionDigits: decimali, useGrouping: true,
})

export function formatEuro(n) {
  return `€ ${eurFmt(2).format(Number(n) || 0)}`
}

export function formatPrezzo(n) {
  return `€ ${eurFmt(3).format(Number(n) || 0)}`
}

export function quantitaLabel(qta, um) {
  return `${qta}${um ?? ''}`
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function importoRiga(r) {
  const q = Number(r.qta) || 0
  const p = Number(r.prezzo) || 0
  const s = Number(r.sconto) || 0
  return round2(q * p * (1 - s / 100))
}

export function risolviDestinazione(fattura) {
  return fattura.destinazione ?? fattura.clienteSnapshot
}

function anagraficaToProps(a = {}) {
  return {
    denominazione: a.denominazione ?? '',
    indirizzo: a.indirizzo ?? '',
    cittaRiga: `${a.cap ?? ''} ${a.citta ?? ''} (${a.prov ?? ''})`.trim(),
    cfPiva: `C.F. ${a.cf ?? ''}   P.Iva ${a.piva ?? ''}`,
  }
}

export function fatturaToProps(doc) {
  const destinatario = anagraficaToProps(doc.clienteSnapshot)
  const destinazione = anagraficaToProps(risolviDestinazione(doc))
  return {
    numero: doc.numeroFormattato ?? '',
    data: doc.data ?? '',
    pagamento: doc.pagamento ?? '',
    scadenze: doc.scadenze ?? null,
    destinatario,
    destinazione,
    righe: (doc.righe ?? []).map((r) => ({
      cod: r.cod ?? '',
      descrizione: r.descrizione ?? '',
      quantita: quantitaLabel(r.qta, r.um),
      prezzo: formatPrezzo(r.prezzo),
      sconto: r.sconto ? `${r.sconto}%` : '',
      importo: formatEuro(importoRiga(r)),
      iva: 'FC',
    })),
    totali: {
      imponibile: formatEuro(0),
      imposta: formatEuro(0),
      fuoriCampo: formatEuro(doc.totaleFuoriCampo),
      bollo: formatEuro(doc.bollo),
      documento: formatEuro(doc.totale),
    },
  }
}
