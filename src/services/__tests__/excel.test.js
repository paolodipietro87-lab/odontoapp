import { describe, it, expect } from 'vitest'
import { mapClienteRow, mapProdottoRow, dedupByCod } from '../excel.js'

describe('mapClienteRow', () => {
  it('maps Danea cliente columns to app fields', () => {
    const row = {
      'Cod.': '0004',
      'Denominazione': 'Dott. CIARDELLI PIERLUIGI',
      'Indirizzo': 'Via Nazionale, 42',
      'Cap': '64100',
      'Città': 'Teramo',
      'Prov.': 'TE',
      'Codice fiscale': 'CRDPLG59R07L103P',
      'Partita Iva': '00780240677',
      'Pagamento': 'Primo incasso',
    }
    expect(mapClienteRow(row)).toEqual({
      cod: '0004',
      denominazione: 'Dott. CIARDELLI PIERLUIGI',
      indirizzo: 'Via Nazionale, 42',
      cap: '64100',
      citta: 'Teramo',
      prov: 'TE',
      cf: 'CRDPLG59R07L103P',
      piva: '00780240677',
      pagamento: 'Primo incasso',
    })
  })

  it('matches the Città header even when mojibaked, and blanks missing fields', () => {
    const row = { 'Cod.': '0005', 'Denominazione': 'X', 'Citt�': 'Teramo' }
    const out = mapClienteRow(row)
    expect(out.citta).toBe('Teramo')
    expect(out.indirizzo).toBe('')
    expect(out.piva).toBe('')
  })
})

describe('mapProdottoRow', () => {
  it('maps Danea prodotto columns and parses listino1 number', () => {
    const row = {
      'Cod.': '0045',
      'Descrizione': 'Filo tondo 0,9',
      'Tipologia': 'Art. con magazzino (lotti)',
      'Cod. Udm': 'mt',
      'Cod. Iva': 'FC',
      'Listino 1': 12.5,
    }
    expect(mapProdottoRow(row)).toEqual({
      cod: '0045',
      descrizione: 'Filo tondo 0,9',
      tipologia: 'Art. con magazzino (lotti)',
      um: 'mt',
      codIva: 'FC',
      listino1: 12.5,
    })
  })

  it('sets listino1 to null when absent', () => {
    const row = { 'Cod.': '1', 'Descrizione': 'Y' }
    expect(mapProdottoRow(row).listino1).toBeNull()
  })
})

describe('dedupByCod', () => {
  it('keeps one row per cod, last wins', () => {
    const rows = [
      { cod: '1', denominazione: 'A' },
      { cod: '2', denominazione: 'B' },
      { cod: '1', denominazione: 'A2' },
    ]
    const out = dedupByCod(rows)
    expect(out).toHaveLength(2)
    expect(out.find((r) => r.cod === '1').denominazione).toBe('A2')
  })
})
