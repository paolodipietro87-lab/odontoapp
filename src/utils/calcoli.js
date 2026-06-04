const SOGLIA_BOLLO = 77.47
const IMPORTO_BOLLO = 2

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function importoRiga(qta, prezzo, sconto) {
  const q = Number(qta) || 0
  const p = Number(prezzo) || 0
  const s = Number(sconto) || 0
  return round2(q * p * (1 - s / 100))
}

export function calcolaTotali(righe) {
  const totaleFuoriCampo = round2(
    (righe ?? []).reduce(
      (sum, r) => sum + importoRiga(r.qta, r.prezzo, r.sconto),
      0,
    ),
  )
  const bollo = totaleFuoriCampo > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0
  return {
    imponibile: 0,
    imposta: 0,
    totaleFuoriCampo,
    bollo,
    totale: round2(totaleFuoriCampo + bollo),
  }
}
