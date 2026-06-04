import { describe, it, expect } from 'vitest'
import { FIELDS, emptyRecord, listColumns } from '../schema.js'

describe('schema', () => {
  it('defines fields for each kind', () => {
    expect(FIELDS.clienti.map((f) => f.name)).toContain('denominazione')
    expect(FIELDS.prodotti.map((f) => f.name)).toContain('listino1')
  })

  it('emptyRecord returns blank values per field, listino1 null', () => {
    const r = emptyRecord('prodotti')
    expect(r.cod).toBe('')
    expect(r.descrizione).toBe('')
    expect(r.listino1).toBeNull()
  })

  it('listColumns returns a subset of field names for the table', () => {
    expect(listColumns('clienti')).toEqual(['cod', 'denominazione', 'citta', 'piva'])
    expect(listColumns('prodotti')).toEqual(['cod', 'descrizione', 'um', 'listino1'])
  })
})
