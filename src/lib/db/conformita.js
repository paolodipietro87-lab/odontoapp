import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const col = () => collection(db, 'conformita')

export async function crea(dati) {
  const ref = await addDoc(col(), {
    data: dati.data ?? '',
    dataConsegna: dati.dataConsegna ?? '',
    prescrizioneMedicaDel: dati.prescrizioneMedicaDel ?? '',
    clienteId: dati.clienteId ?? null,
    clienteSnapshot: dati.clienteSnapshot ?? null,
    paziente: dati.paziente ?? '',
    descrizioneDispositivo: dati.descrizioneDispositivo ?? '',
    terminiUtilizzazione: dati.terminiUtilizzazione ?? '',
    avvertenze: dati.avvertenze ?? '',
    prodottiConsigliati: dati.prodottiConsigliati ?? '',
    noteParticolari: dati.noteParticolari ?? '',
    materiali: dati.materiali ?? [],
    creatoIl: serverTimestamp(),
    aggiornatoIl: serverTimestamp(),
  })
  return ref.id
}

export async function getOne(id) {
  const snap = await getDoc(doc(col(), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function aggiorna(id, dati) {
  await updateDoc(doc(col(), id), { ...dati, aggiornatoIl: serverTimestamp() })
}

export async function elimina(id) {
  await deleteDoc(doc(col(), id))
}

export async function listAll() {
  const snap = await getDocs(query(col(), orderBy('data', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
