import { describe, it, expect } from 'vitest'
import { importoRiga, calcolaTotali } from '../calcoli.js'

describe('importoRiga', () => {
  it('qta * prezzo without discount', () => {
    expect(importoRiga(2, 10, 0)).toBe(20)
  })
  it('applies percent discount', () => {
    expect(importoRiga(1, 100, 10)).toBe(90)
  })
  it('rounds to 2 decimals', () => {
    expect(importoRiga(3, 3.333, 0)).toBe(10)
    expect(importoRiga(1, 1.005, 0)).toBe(1.01)
  })
  it('treats missing/empty values as 0', () => {
    expect(importoRiga(null, 10, undefined)).toBe(0)
  })
})

describe('calcolaTotali', () => {
  const righe = [
    { qta: 1, prezzo: 50, sconto: 0 },
    { qta: 1, prezzo: 40, sconto: 0 },
  ]
  it('imponibile and imposta are always 0 (Fuori Campo)', () => {
    const t = calcolaTotali(righe)
    expect(t.imponibile).toBe(0)
    expect(t.imposta).toBe(0)
  })
  it('totaleFuoriCampo is the sum of line importi', () => {
    expect(calcolaTotali(righe).totaleFuoriCampo).toBe(90)
  })
  it('bollo is 2.00 when totaleFuoriCampo > 77.47', () => {
    expect(calcolaTotali(righe).bollo).toBe(2)
  })
  it('no bollo at exactly 77.47 (strict >)', () => {
    const t = calcolaTotali([{ qta: 1, prezzo: 77.47, sconto: 0 }])
    expect(t.bollo).toBe(0)
    expect(t.totale).toBe(77.47)
  })
  it('bollo at 77.48', () => {
    const t = calcolaTotali([{ qta: 1, prezzo: 77.48, sconto: 0 }])
    expect(t.bollo).toBe(2)
    expect(t.totale).toBe(79.48)
  })
  it('no bollo below threshold', () => {
    expect(calcolaTotali([{ qta: 1, prezzo: 50, sconto: 0 }]).bollo).toBe(0)
  })
  it('totale = totaleFuoriCampo + bollo', () => {
    expect(calcolaTotali(righe).totale).toBe(92)
  })
  it('empty righe -> all zero', () => {
    expect(calcolaTotali([])).toEqual({
      imponibile: 0, imposta: 0, totaleFuoriCampo: 0, bollo: 0, totale: 0,
    })
  })
})
