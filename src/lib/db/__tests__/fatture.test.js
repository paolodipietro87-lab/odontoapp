import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = { writes: [], deletes: [], doc: null }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => ({ name }),
  doc: (colOrDb, id) => ({ id: id ?? 'auto-id' }),
  addDoc: vi.fn((col, data) => { store.writes.push({ data }); return Promise.resolve({ id: 'new-id' }) }),
  setDoc: vi.fn((ref, data) => { store.writes.push({ ref, data }); return Promise.resolve() }),
  updateDoc: vi.fn((ref, data) => { store.writes.push({ ref, data }); return Promise.resolve() }),
  deleteDoc: vi.fn((ref) => { store.deletes.push(ref); return Promise.resolve() }),
  getDoc: vi.fn((ref) => Promise.resolve({
    exists: () => store.doc != null,
    id: ref.id,
    data: () => store.doc,
  })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [{ id: 'f1', data: () => ({ stato: 'emessa', numeroFormattato: '001/2026' }) }],
  })),
  query: (col) => col,
  orderBy: () => ({}),
  serverTimestamp: () => 'TS',
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

beforeEach(() => { store.writes = []; store.deletes = []; store.doc = null })

describe('fatture db', () => {
  it('creaBozza writes a draft with null numbering fields', async () => {
    const { creaBozza } = await import('../fatture.js')
    const id = await creaBozza({ data: '2026-06-04', righe: [] })
    expect(id).toBe('new-id')
    const written = store.writes[0].data
    expect(written.stato).toBe('bozza')
    expect(written.numero).toBeNull()
    expect(written.anno).toBeNull()
    expect(written.numeroFormattato).toBeNull()
  })

  it('aggiornaBozza updates when the invoice is a draft', async () => {
    store.doc = { stato: 'bozza', righe: [] }
    const { aggiornaBozza } = await import('../fatture.js')
    await aggiornaBozza('f1', { data: '2026-06-05' })
    expect(store.writes).toHaveLength(1)
    expect(store.writes[0].data.data).toBe('2026-06-05')
  })

  it('aggiornaBozza refuses to touch an emitted invoice', async () => {
    store.doc = { stato: 'emessa', numero: 1 }
    const { aggiornaBozza } = await import('../fatture.js')
    await expect(aggiornaBozza('f1', { data: 'x' })).rejects.toThrow(/emessa/i)
    expect(store.writes).toHaveLength(0)
  })

  it('deleteBozza refuses to delete an emitted invoice', async () => {
    store.doc = { stato: 'emessa', numero: 1 }
    const { deleteBozza } = await import('../fatture.js')
    await expect(deleteBozza('f1')).rejects.toThrow(/emessa/i)
    expect(store.deletes).toHaveLength(0)
  })

  it('deleteBozza deletes a draft', async () => {
    store.doc = { stato: 'bozza' }
    const { deleteBozza } = await import('../fatture.js')
    await deleteBozza('f1')
    expect(store.deletes).toHaveLength(1)
  })

  it('listAll returns docs with their id', async () => {
    const { listAll } = await import('../fatture.js')
    const out = await listAll()
    expect(out).toEqual([{ id: 'f1', stato: 'emessa', numeroFormattato: '001/2026' }])
  })
})
