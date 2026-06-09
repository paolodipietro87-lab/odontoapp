// Logica pura magazzino — niente Firestore, unit-testabile.

export function statoMagazzino(disp) {
  const n = Number(disp)
  return Number.isFinite(n) && n > 0 ? 'disponibile' : 'esaurito'
}

export function isServizio(prodotto) {
  return String(prodotto?.tipologia ?? '').trim().toLowerCase() === 'servizio'
}

export function filtroMagazzino(prodotti) {
  return (prodotti ?? []).filter((p) => !isServizio(p))
}

// Da materiali conformità a [{prodottoId, qta}], solo righe valide, sommate per prodotto.
export function righeScarico(materiali) {
  const map = new Map()
  for (const m of materiali ?? []) {
    const id = m?.prodottoId
    const qta = Number(m?.qta)
    if (!id || !Number.isFinite(qta) || qta <= 0) continue
    map.set(id, (map.get(id) ?? 0) + qta)
  }
  return [...map.entries()].map(([prodottoId, qta]) => ({ prodottoId, qta }))
}

export function applicaDelta(disp, delta) {
  return (Number(disp) || 0) + (Number(delta) || 0)
}
