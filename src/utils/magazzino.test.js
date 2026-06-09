import { describe, it, expect } from 'vitest'
import { statoMagazzino, isServizio, filtroMagazzino, righeScarico, applicaDelta } from './magazzino.js'

describe('statoMagazzino', () => {
  it('disponibile se > 0', () => { expect(statoMagazzino(3)).toBe('disponibile') })
  it('esaurito se 0', () => { expect(statoMagazzino(0)).toBe('esaurito') })
  it('esaurito se negativo', () => { expect(statoMagazzino(-1)).toBe('esaurito') })
  it('esaurito se null/undefined', () => {
    expect(statoMagazzino(null)).toBe('esaurito')
    expect(statoMagazzino(undefined)).toBe('esaurito')
  })
})

describe('isServizio / filtroMagazzino', () => {
  it('riconosce Servizio (case/spazi insensibile)', () => {
    expect(isServizio({ tipologia: 'Servizio' })).toBe(true)
    expect(isServizio({ tipologia: ' servizio ' })).toBe(true)
    expect(isServizio({ tipologia: 'Prodotto' })).toBe(false)
    expect(isServizio({})).toBe(false)
  })
  it('filtroMagazzino esclude i Servizio', () => {
    const out = filtroMagazzino([{ cod: 'A', tipologia: 'Prodotto' }, { cod: 'B', tipologia: 'Servizio' }])
    expect(out.map((p) => p.cod)).toEqual(['A'])
  })
})

describe('righeScarico', () => {
  it('tiene solo righe con prodottoId e qta>0', () => {
    const out = righeScarico([
      { prodottoId: 'A', qta: 2 },
      { prodottoId: 'B', qta: 0 },
      { prodottoId: '', qta: 5 },
      { qta: 3 },
    ])
    expect(out).toEqual([{ prodottoId: 'A', qta: 2 }])
  })
  it('somma le quantità dello stesso prodotto', () => {
    const out = righeScarico([{ prodottoId: 'A', qta: 2 }, { prodottoId: 'A', qta: 3 }])
    expect(out).toEqual([{ prodottoId: 'A', qta: 5 }])
  })
  it('lista vuota / undefined => []', () => {
    expect(righeScarico([])).toEqual([])
    expect(righeScarico(undefined)).toEqual([])
  })
})

describe('applicaDelta', () => {
  it('somma algebrica', () => {
    expect(applicaDelta(10, -3)).toBe(7)
    expect(applicaDelta(5, 4)).toBe(9)
  })
  it('disp null trattato come 0', () => { expect(applicaDelta(null, 5)).toBe(5) })
  it('può andare sotto zero', () => { expect(applicaDelta(2, -5)).toBe(-3) })
})
