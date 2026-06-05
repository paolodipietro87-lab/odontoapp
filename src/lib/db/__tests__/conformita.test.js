import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = { writes: [], deletes: [], doc: null }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => ({ name }),
  doc: (colOrDb, id) => ({ id: id ?? 'auto-id' }),
  addDoc: vi.fn((col, data) => { store.writes.push({ data }); return Promise.resolve({ id: 'new-id' }) }),
  updateDoc: vi.fn((ref, data) => { store.writes.push({ ref, data }); return Promise.resolve() }),
  deleteDoc: vi.fn((ref) => { store.deletes.push(ref); return Promise.resolve() }),
  getDoc: vi.fn((ref) => Promise.resolve({
    exists: () => store.doc != null, id: ref.id, data: () => store.doc,
  })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [{ id: 'c1', data: () => ({ paziente: 'Botticelli Angela', data: '11-11-21' }) }],
  })),
  query: (col) => col,
  orderBy: () => ({}),
  serverTimestamp: () => 'TS',
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

beforeEach(() => { store.writes = []; store.deletes = []; store.doc = null })

describe('conformita db', () => {
  it('crea scrive il documento con i timestamp', async () => {
    const { crea } = await import('../conformita.js')
    const id = await crea({ paziente: 'Botticelli Angela', materiali: [] })
    expect(id).toBe('new-id')
    expect(store.writes[0].data.paziente).toBe('Botticelli Angela')
    expect(store.writes[0].data.creatoIl).toBe('TS')
  })

  it('getOne ritorna il doc con id', async () => {
    store.doc = { paziente: 'X' }
    const { getOne } = await import('../conformita.js')
    expect(await getOne('c1')).toEqual({ id: 'c1', paziente: 'X' })
  })

  it('getOne ritorna null se non esiste', async () => {
    store.doc = null
    const { getOne } = await import('../conformita.js')
    expect(await getOne('c1')).toBeNull()
  })

  it('aggiorna scrive i campi + aggiornatoIl', async () => {
    const { aggiorna } = await import('../conformita.js')
    await aggiorna('c1', { paziente: 'Y' })
    expect(store.writes[0].data.paziente).toBe('Y')
    expect(store.writes[0].data.aggiornatoIl).toBe('TS')
  })

  it('elimina cancella il documento', async () => {
    const { elimina } = await import('../conformita.js')
    await elimina('c1')
    expect(store.deletes).toHaveLength(1)
  })

  it('listAll ritorna i docs con id', async () => {
    const { listAll } = await import('../conformita.js')
    const out = await listAll()
    expect(out).toEqual([{ id: 'c1', paziente: 'Botticelli Angela', data: '11-11-21' }])
  })
})
