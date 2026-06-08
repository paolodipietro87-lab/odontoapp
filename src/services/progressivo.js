import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

export function formattaNumero(numero, anno) {
  return `${String(numero).padStart(3, '0')}/${anno}`
}

// true se nuovaData (ISO) è precedente a ultimaData (ISO). Vuoti => false.
export function dataPrecedente(nuovaData, ultimaData) {
  if (!nuovaData || !ultimaData) return false
  return String(nuovaData) < String(ultimaData)
}

// Legge l'ultima fattura emessa dell'anno dal contatore.
// Ritorna null se non c'è ancora nessuna emessa per quell'anno.
export async function getUltimaEmessa(anno) {
  const snap = await getDoc(doc(db, 'contatori', String(anno)))
  if (!snap.exists()) return null
  const d = snap.data()
  if (!d.ultimaData) return null
  return { ultimaData: d.ultimaData, ultimoNumeroFormattato: d.ultimoNumeroFormattato ?? null }
}

export async function emettiFattura(fatturaId) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Serve connessione internet per emettere il numero')
  }
  return runTransaction(db, async (tx) => {
    const fatturaRef = doc(db, 'fatture', fatturaId)
    const fatturaSnap = await tx.get(fatturaRef)
    if (!fatturaSnap.exists()) throw new Error('Fattura inesistente')
    const fattura = fatturaSnap.data()
    if (fattura.stato !== 'bozza') throw new Error('Fattura già emessa')

    const anno = Number(String(fattura.data).slice(0, 4))
    if (!anno) throw new Error('Data fattura mancante o non valida')

    const contatoreRef = doc(db, 'contatori', String(anno))
    const contatoreSnap = await tx.get(contatoreRef)
    const ultimo = contatoreSnap.exists() ? (contatoreSnap.data().ultimoNumero ?? 0) : 0
    const numero = ultimo + 1
    const numeroFormattato = formattaNumero(numero, anno)

    tx.set(
      contatoreRef,
      { ultimoNumero: numero, ultimaData: fattura.data, ultimoNumeroFormattato: numeroFormattato },
      { merge: true },
    )
    tx.update(fatturaRef, {
      stato: 'emessa',
      numero,
      anno,
      numeroFormattato,
      emessoIl: serverTimestamp(),
    })

    return { numero, anno, numeroFormattato }
  })
}
