import { describe, it, expect, vi, beforeEach } from 'vitest'

const calls = { writes: [], collections: [], deletes: [] }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => { calls.collections.push(name); return { name } },
  doc: (col, id) => ({ col, id }),
  setDoc: vi.fn((ref, data) => { calls.writes.push({ ref, data }); return Promise.resolve() }),
  deleteDoc: vi.fn((ref) => { calls.deletes.push(ref); return Promise.resolve() }),
  getDoc: vi.fn((ref) => Promise.resolve({
    exists: () => ref.id === '0004',
    id: ref.id,
    data: () => ({ cod: '0004', denominazione: 'A' }),
  })),
  writeBatch: () => {
    const ops = []
    return {
      set: (ref, data) => ops.push({ ref, data }),
      commit: () => { calls.writes.push(...ops); return Promise.resolve() },
    }
  },
  getDocs: vi.fn(() => Promise.resolve({
    docs: [{ id: 'a', data: () => ({ cod: '1', denominazione: 'A' }) }],
  })),
  query: (col) => col,
  orderBy: () => ({}),
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

describe('anagrafiche db', () => {
  beforeEach(() => { calls.writes = []; calls.collections = []; calls.deletes = [] })

  it('importRows writes one doc per row keyed by cod', async () => {
    const { importRows } = await import('../anagrafiche.js')
    await importRows('clienti', [
      { cod: '0004', denominazione: 'A' },
      { cod: '0005', denominazione: 'B' },
    ])
    expect(calls.writes).toHaveLength(2)
    expect(calls.writes[0].ref.id).toBe('0004')
    expect(calls.writes[0].data.denominazione).toBe('A')
  })

  it('listAll returns docs with their id', async () => {
    const { listAll } = await import('../anagrafiche.js')
    const out = await listAll('clienti')
    expect(out).toEqual([{ id: 'a', cod: '1', denominazione: 'A' }])
  })
})

describe('anagrafiche single-record ops', () => {
  it('getOne returns the record with id when it exists', async () => {
    const { getOne } = await import('../anagrafiche.js')
    const rec = await getOne('clienti', '0004')
    expect(rec).toEqual({ id: '0004', cod: '0004', denominazione: 'A' })
  })

  it('getOne returns null when missing', async () => {
    const { getOne } = await import('../anagrafiche.js')
    const rec = await getOne('clienti', '9999')
    expect(rec).toBeNull()
  })

  it('upsertOne writes the record keyed by cod', async () => {
    const { upsertOne } = await import('../anagrafiche.js')
    await upsertOne('clienti', { cod: '0007', denominazione: 'Z' })
    expect(calls.writes).toHaveLength(1)
    expect(calls.writes[0].ref.id).toBe('0007')
    expect(calls.writes[0].data.denominazione).toBe('Z')
  })

  it('upsertOne rejects an empty cod', async () => {
    const { upsertOne } = await import('../anagrafiche.js')
    await expect(upsertOne('clienti', { cod: '', denominazione: 'Z' }))
      .rejects.toThrow(/codice/i)
  })

  it('deleteOne deletes by id', async () => {
    const { deleteOne } = await import('../anagrafiche.js')
    await deleteOne('clienti', '0004')
    expect(calls.deletes).toHaveLength(1)
    expect(calls.deletes[0].id).toBe('0004')
  })
})
