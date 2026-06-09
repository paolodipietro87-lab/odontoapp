import { describe, it, expect, beforeEach, vi } from 'vitest'

const mem = { docs: {} }

vi.mock('firebase/firestore', () => ({
  doc: (db, coll, id) => ({ path: `${coll}/${id}` }),
  runTransaction: async (db, updateFn) => {
    const tx = {
      get: async (ref) => ({
        exists: () => mem.docs[ref.path] !== undefined,
        data: () => mem.docs[ref.path],
      }),
      update: (ref, data) => { mem.docs[ref.path] = { ...(mem.docs[ref.path] ?? {}), ...data } },
    }
    return updateFn(tx)
  },
}))
vi.mock('../../firebase.js', () => ({ db: {} }))

describe('caricaProdotto', () => {
  beforeEach(() => { mem.docs = {} })
  it('aggiunge quantità', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    mem.docs['prodotti/P1'] = { cod: 'P1', qtaDisponibile: 5 }
    const nuova = await caricaProdotto('P1', 3)
    expect(nuova).toBe(8)
    expect(mem.docs['prodotti/P1'].qtaDisponibile).toBe(8)
  })
  it('parte da 0 se disponibile mancante', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    mem.docs['prodotti/P2'] = { cod: 'P2' }
    expect(await caricaProdotto('P2', 4)).toBe(4)
  })
  it('rifiuta quantità non positiva', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    await expect(caricaProdotto('P1', 0)).rejects.toThrow(/quantità/i)
  })
  it('rifiuta prodotto inesistente', async () => {
    const { caricaProdotto } = await import('../magazzino.js')
    await expect(caricaProdotto('nope', 2)).rejects.toThrow(/inesistente/i)
  })
})

describe('scaricaConformita', () => {
  beforeEach(() => { mem.docs = {} })
  it('scala i prodotti e segna scaricata', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    mem.docs['prodotti/A'] = { cod: 'A', qtaDisponibile: 10 }
    mem.docs['prodotti/B'] = { cod: 'B', qtaDisponibile: 4 }
    mem.docs['conformita/c1'] = { materiali: [
      { prodottoId: 'A', qta: 3 }, { prodottoId: 'B', qta: 1 }, { tipo: 'a mano' },
    ] }
    const n = await scaricaConformita('c1')
    expect(n).toBe(2)
    expect(mem.docs['prodotti/A'].qtaDisponibile).toBe(7)
    expect(mem.docs['prodotti/B'].qtaDisponibile).toBe(3)
    expect(mem.docs['conformita/c1'].scaricata).toBe(true)
  })
  it('rifiuta doppio scarico', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    mem.docs['conformita/c1'] = { scaricata: true, materiali: [] }
    await expect(scaricaConformita('c1')).rejects.toThrow(/già scaricat/i)
  })
  it('salta prodotti mancanti senza fallire', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    mem.docs['conformita/c2'] = { materiali: [{ prodottoId: 'X', qta: 2 }] }
    const n = await scaricaConformita('c2')
    expect(n).toBe(1)
    expect(mem.docs['conformita/c2'].scaricata).toBe(true)
  })
  it('rifiuta conformità inesistente', async () => {
    const { scaricaConformita } = await import('../magazzino.js')
    await expect(scaricaConformita('nope')).rejects.toThrow(/inesistente/i)
  })
})
