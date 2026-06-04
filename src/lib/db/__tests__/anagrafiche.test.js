import { describe, it, expect, vi, beforeEach } from 'vitest'

const calls = { writes: [], collections: [] }
vi.mock('firebase/firestore', () => ({
  collection: (db, name) => { calls.collections.push(name); return { name } },
  doc: (col, id) => ({ col, id }),
  setDoc: vi.fn((ref, data) => { calls.writes.push({ ref, data }); return Promise.resolve() }),
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
  beforeEach(() => { calls.writes = []; calls.collections = [] })

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
