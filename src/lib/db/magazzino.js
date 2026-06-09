import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase.js'
import { righeScarico, applicaDelta } from '../../utils/magazzino.js'

// Aggiunge `qta` alla disponibilità del prodotto (doc id = cod). Ritorna la nuova quantità.
export async function caricaProdotto(cod, qta) {
  const q = Number(qta)
  if (!Number.isFinite(q) || q <= 0) throw new Error('Quantità non valida')
  const ref = doc(db, 'prodotti', cod)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Prodotto inesistente')
    const nuova = applicaDelta(snap.data().qtaDisponibile, q)
    tx.update(ref, { qtaDisponibile: nuova })
    return nuova
  })
}

// Scala il magazzino in base ai materiali della conformità. One-shot (flag `scaricata`).
// Ritorna il numero di righe-prodotto scaricate.
export async function scaricaConformita(conformitaId) {
  const confRef = doc(db, 'conformita', conformitaId)
  return runTransaction(db, async (tx) => {
    const confSnap = await tx.get(confRef)
    if (!confSnap.exists()) throw new Error('Conformità inesistente')
    const conf = confSnap.data()
    if (conf.scaricata) throw new Error('Magazzino già scaricato per questa conformità')

    const righe = righeScarico(conf.materiali)
    // Firestore: tutte le letture PRIMA delle scritture.
    const letti = []
    for (const r of righe) {
      const pRef = doc(db, 'prodotti', r.prodottoId)
      letti.push({ ref: pRef, snap: await tx.get(pRef), qta: r.qta })
    }
    for (const l of letti) {
      if (!l.snap.exists()) continue
      tx.update(l.ref, { qtaDisponibile: applicaDelta(l.snap.data().qtaDisponibile, -l.qta) })
    }
    tx.update(confRef, { scaricata: true })
    return righe.length
  })
}
