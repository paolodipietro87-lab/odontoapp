import {
  collection,
  doc,
  writeBatch,
  getDocs,
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
