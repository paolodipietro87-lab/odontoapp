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
    expect(mapClienteRow(row)).toMatchObject({
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

  it('maps extended cliente columns (contatti, commerciale, note)', () => {
    const row = {
      'Cod.': '0004',
      'Referente': 'Mario Rossi',
      'Tel.': '0861-123',
      'Cell': '333-1',
      'Fax': '0861-999',
      'e-mail': 'a@b.it',
      'Pec': 'a@pec.it',
      'Sconti': '10',
      'Listino': '1',
      'Fido': '5000',
      'Agente': 'AG1',
      'Note': 'nota libera',
      'Note doc.': 'nota doc',
    }
    expect(mapClienteRow(row)).toMatchObject({
      referente: 'Mario Rossi',
      tel: '0861-123',
      cell: '333-1',
      fax: '0861-999',
      email: 'a@b.it',
      pec: 'a@pec.it',
      sconti: '10',
      listino: '1',
      fido: '5000',
      agente: 'AG1',
      note: 'nota libera',
      noteDoc: 'nota doc',
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
    expect(mapProdottoRow(row)).toMatchObject({
      cod: '0045',
      descrizione: 'Filo tondo 0,9',
      tipologia: 'Art. con magazzino (lotti)',
      um: 'mt',
      codIva: 'FC',
      listino1: 12.5,
    })
  })

  it('maps extended prodotto columns (categorie, listini, fornitore)', () => {
    const row = {
      'Cod.': '0045',
      'Categoria': 'Ortodonzia',
      'Sottocategoria': 'Fili',
      'Listino 2': 14,
      'Listino 3': '15,5',
      'Note': 'nota prod',
      'Cod. a barre': '800123',
      'Produttore': 'ACME',
      'Cod. fornitore': 'F01',
      'Fornitore': 'GERHO',
      'Prezzo forn.': '9,9',
    }
    expect(mapProdottoRow(row)).toMatchObject({
      categoria: 'Ortodonzia',
      sottocategoria: 'Fili',
      listino2: 14,
      listino3: 15.5,
      note: 'nota prod',
      codBarre: '800123',
      produttore: 'ACME',
      codFornitore: 'F01',
      fornitore: 'GERHO',
      prezzoForn: 9.9,
    })
  })

  it('sets listino1 to null when absent', () => {
    const row = { 'Cod.': '1', 'Descrizione': 'Y' }
    expect(mapProdottoRow(row).listino1).toBeNull()
  })
})

describe('mapProdottoRow qtaDisponibile', () => {
  it('legge la Q.tà disponibile dalla colonna AJ', () => {
    const r = mapProdottoRow({ 'Cod.': 'P1', 'Descrizione': 'Resina', 'Q.tà disponibile': 12 })
    expect(r.qtaDisponibile).toBe(12)
  })
  it('qtaDisponibile null se vuota', () => {
    const r = mapProdottoRow({ 'Cod.': 'P2', 'Descrizione': 'X' })
    expect(r.qtaDisponibile).toBeNull()
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
