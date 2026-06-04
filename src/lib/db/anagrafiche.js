import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const KINDS = ['clienti', 'fornitori', 'prodotti']

function assertKind(kind) {
  if (!KINDS.includes(kind)) throw new Error(`Tipo anagrafica sconosciuto: ${kind}`)
}

export async function importRows(kind, rows) {
  assertKind(kind)
  const col = collection(db, kind)
  const batch = writeBatch(db)
  for (const row of rows) {
    batch.set(doc(col, row.cod), row)
  }
  await batch.commit()
  return rows.length
}

export async function listAll(kind) {
  assertKind(kind)
  const col = collection(db, kind)
  const snap = await getDocs(query(col, orderBy('cod')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getOne(kind, id) {
  assertKind(kind)
  const snap = await getDoc(doc(collection(db, kind), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function upsertOne(kind, record) {
  assertKind(kind)
  const cod = String(record.cod ?? '').trim()
  if (!cod) throw new Error('Codice obbligatorio')
  await setDoc(doc(collection(db, kind), cod), { ...record, cod })
  return cod
}

export async function deleteOne(kind, id) {
  assertKind(kind)
  await deleteDoc(doc(collection(db, kind), id))
}
