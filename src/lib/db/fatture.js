import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const col = () => collection(db, 'fatture')

export async function creaBozza(dati) {
  const ref = await addDoc(col(), {
    stato: 'bozza',
    numero: null,
    anno: null,
    numeroFormattato: null,
    data: dati.data ?? '',
    clienteId: dati.clienteId ?? null,
    clienteSnapshot: dati.clienteSnapshot ?? null,
    destinazione: dati.destinazione ?? null,
    righe: dati.righe ?? [],
    imponibile: 0,
    imposta: 0,
    totaleFuoriCampo: dati.totaleFuoriCampo ?? 0,
    bollo: dati.bollo ?? 0,
    totale: dati.totale ?? 0,
    pagamento: dati.pagamento ?? '',
    scadenze: dati.scadenze ?? null,
    creatoIl: serverTimestamp(),
    aggiornatoIl: serverTimestamp(),
    emessoIl: null,
  })
  return ref.id
}

export async function getOne(id) {
  const snap = await getDoc(doc(col(), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

async function assertBozza(id) {
  const snap = await getDoc(doc(col(), id))
  if (!snap.exists()) throw new Error('Fattura inesistente')
  if (snap.data().stato !== 'bozza') {
    throw new Error('Fattura già emessa: sola lettura')
  }
}

export async function aggiornaBozza(id, dati) {
  await assertBozza(id)
  await updateDoc(doc(col(), id), { ...dati, aggiornatoIl: serverTimestamp() })
}

export async function deleteBozza(id) {
  await assertBozza(id)
  await deleteDoc(doc(col(), id))
}

export async function listAll() {
  const snap = await getDocs(query(col(), orderBy('data', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
