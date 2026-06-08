import { describe, it, expect } from 'vitest'
import { filtraOpzioni } from './autocomplete.js'

const opts = [
  { label: 'Studio Rossi', detail: 'Milano — Via Roma 1' },
  { label: 'Dott. Bianchi', detail: 'Torino — Corso Francia 5' },
  { label: 'Clinica Verdi', detail: 'Milano — Piazza Duomo' },
]

describe('filtraOpzioni', () => {
  it('query vuota restituisce tutte', () => {
    expect(filtraOpzioni(opts, '')).toHaveLength(3)
  })
  it('match case-insensitive su label', () => {
    expect(filtraOpzioni(opts, 'rossi')).toEqual([opts[0]])
  })
  it('match su detail (città)', () => {
    expect(filtraOpzioni(opts, 'milano').map((o) => o.label))
      .toEqual(['Studio Rossi', 'Clinica Verdi'])
  })
  it('tutti i token devono matchare (AND)', () => {
    expect(filtraOpzioni(opts, 'milano verdi')).toEqual([opts[2]])
  })
  it('nessun match → array vuoto', () => {
    expect(filtraOpzioni(opts, 'zzz')).toEqual([])
  })
  it('rispetta il limite', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ label: `X${i}` }))
    expect(filtraOpzioni(many, '', 50)).toHaveLength(50)
  })
  it('tollera option senza detail', () => {
    expect(filtraOpzioni([{ label: 'Solo Label' }], 'solo')).toHaveLength(1)
  })
})
