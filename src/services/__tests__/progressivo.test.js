import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formattaNumero, dataPrecedente } from '../progressivo.js'

const mem = { docs: {}, onBeforeRun: null }

vi.mock('firebase/firestore', () => ({
  doc: (db, coll, id) => ({ path: `${coll}/${id}` }),
  getDoc: async (ref) => ({
    exists: () => mem.docs[ref.path] !== undefined,
    data: () => mem.docs[ref.path],
  }),
  serverTimestamp: () => 'TS',
  runTransaction: async (db, updateFn) => {
    if (mem.onBeforeRun) { mem.onBeforeRun(); mem.onBeforeRun = null }
    const tx = {
      get: async (ref) => ({
        exists: () => mem.docs[ref.path] !== undefined,
        data: () => mem.docs[ref.path],
      }),
      set: (ref, data, opts) => {
        mem.docs[ref.path] = opts?.merge
          ? { ...(mem.docs[ref.path] ?? {}), ...data }
          : data
      },
      update: (ref, data) => {
        mem.docs[ref.path] = { ...(mem.docs[ref.path] ?? {}), ...data }
      },
    }
    return updateFn(tx)
  },
}))
vi.mock('../../lib/firebase.js', () => ({ db: {} }))

function seedFattura(id, data, stato = 'bozza') {
  mem.docs[`fatture/${id}`] = { stato, data, righe: [] }
}

describe('formattaNumero', () => {
  it('zero-pads to 3 digits', () => {
    expect(formattaNumero(1, 2026)).toBe('001/2026')
    expect(formattaNumero(12, 2026)).toBe('012/2026')
    expect(formattaNumero(123, 2026)).toBe('123/2026')
  })
  it('keeps 4+ digit numbers as-is', () => {
    expect(formattaNumero(1234, 2026)).toBe('1234/2026')
  })
})

describe('dataPrecedente', () => {
  it('true se nuova data prima della ultima', () => {
    expect(dataPrecedente('2026-03-05', '2026-03-10')).toBe(true)
  })
  it('false se uguale o successiva', () => {
    expect(dataPrecedente('2026-03-10', '2026-03-10')).toBe(false)
    expect(dataPrecedente('2026-03-11', '2026-03-10')).toBe(false)
  })
  it('false con dati mancanti', () => {
    expect(dataPrecedente('', '2026-03-10')).toBe(false)
    expect(dataPrecedente('2026-03-10', '')).toBe(false)
  })
})

describe('getUltimaEmessa', () => {
  beforeEach(() => { mem.docs = {} })
  it('null se nessuna emessa per l anno', async () => {
    const { getUltimaEmessa } = await import('../progressivo.js')
    expect(await getUltimaEmessa(2026)).toBeNull()
  })
  it('ritorna ultimaData e numero dal contatore', async () => {
    const { getUltimaEmessa } = await import('../progressivo.js')
    mem.docs['contatori/2026'] = { ultimoNumero: 3, ultimaData: '2026-03-10', ultimoNumeroFormattato: '003/2026' }
    expect(await getUltimaEmessa(2026)).toEqual({ ultimaData: '2026-03-10', ultimoNumeroFormattato: '003/2026' })
  })
  it('emettiFattura registra ultimaData nel contatore', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f1', '2026-03-10')
    await emettiFattura('f1')
    expect(mem.docs['contatori/2026'].ultimaData).toBe('2026-03-10')
    expect(mem.docs['contatori/2026'].ultimoNumeroFormattato).toBe('001/2026')
  })
})

describe('emettiFattura (transaction)', () => {
  beforeEach(() => { mem.docs = {}; mem.onBeforeRun = null })

  it('first invoice of 2026 -> 001/2026 and counter = 1', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f1', '2026-03-10')
    const res = await emettiFattura('f1')
    expect(res).toEqual({ numero: 1, anno: 2026, numeroFormattato: '001/2026' })
    expect(mem.docs['contatori/2026'].ultimoNumero).toBe(1)
    expect(mem.docs['fatture/f1'].stato).toBe('emessa')
    expect(mem.docs['fatture/f1'].numeroFormattato).toBe('001/2026')
  })

  it('sequential emissions have no gaps: 001,002,003', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('a', '2026-01-01'); seedFattura('b', '2026-01-02'); seedFattura('c', '2026-01-03')
    expect((await emettiFattura('a')).numeroFormattato).toBe('001/2026')
    expect((await emettiFattura('b')).numeroFormattato).toBe('002/2026')
    expect((await emettiFattura('c')).numeroFormattato).toBe('003/2026')
    expect(mem.docs['contatori/2026'].ultimoNumero).toBe(3)
  })

  it('year comes from the invoice DATE, not today', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f', '2026-12-31')
    const res = await emettiFattura('f')
    expect(res.anno).toBe(2026)
    expect(res.numeroFormattato).toBe('001/2026')
  })

  it('new year restarts at 001', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    mem.docs['contatori/2026'] = { ultimoNumero: 9 }
    seedFattura('f', '2027-01-05')
    expect((await emettiFattura('f')).numeroFormattato).toBe('001/2027')
    expect(mem.docs['contatori/2026'].ultimoNumero).toBe(9)
  })

  it('concurrent counter bump before run -> next number, never duplicate', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    mem.docs['contatori/2026'] = { ultimoNumero: 5 }
    seedFattura('f', '2026-06-01')
    mem.onBeforeRun = () => { mem.docs['contatori/2026'] = { ultimoNumero: 6 } }
    const res = await emettiFattura('f')
    expect(res.numero).toBe(7)
    expect(res.numeroFormattato).toBe('007/2026')
  })

  it('refuses to emit an already-emitted invoice', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f', '2026-06-01', 'emessa')
    mem.docs['fatture/f'].numero = 3
    await expect(emettiFattura('f')).rejects.toThrow(/già emessa/i)
    expect(mem.docs['contatori/2026']).toBeUndefined()
  })

  it('refuses to emit a non-existent invoice', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    await expect(emettiFattura('nope')).rejects.toThrow(/inesistente/i)
  })

  it('refuses to emit while offline, counter untouched', async () => {
    const { emettiFattura } = await import('../progressivo.js')
    seedFattura('f', '2026-06-01')
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    try {
      await expect(emettiFattura('f')).rejects.toThrow(/connessione/i)
      expect(mem.docs['contatori/2026']).toBeUndefined()
      expect(mem.docs['fatture/f'].stato).toBe('bozza')
    } finally { spy.mockRestore() }
  })
})
