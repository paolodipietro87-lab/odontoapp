import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'

export function formattaNumero(numero, anno) {
  return `${String(numero).padStart(3, '0')}/${anno}`
}

export async function emettiFattura(fatturaId) {
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

    tx.set(contatoreRef, { ultimoNumero: numero }, { merge: true })
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
