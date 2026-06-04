import { describe, it, expect } from 'vitest'
import {
  formatEuro, formatPrezzo, quantitaLabel, risolviDestinazione, fatturaToProps,
} from './fattura.format.js'

describe('formatEuro', () => {
  it('formatta con virgola e due decimali', () => {
    expect(formatEuro(735)).toBe('€ 735,00')
    expect(formatEuro(0)).toBe('€ 0,00')
    expect(formatEuro(737)).toBe('€ 737,00')
    expect(formatEuro(1234.5)).toBe('€ 1.234,50')
  })
})

describe('formatPrezzo', () => {
  it('formatta a tre decimali', () => {
    expect(formatPrezzo(30)).toBe('€ 30,000')
    expect(formatPrezzo(25.5)).toBe('€ 25,500')
  })
})

describe('quantitaLabel', () => {
  it('unisce quantità e unità di misura', () => {
    expect(quantitaLabel(1, 'pz')).toBe('1pz')
    expect(quantitaLabel(20, 'pz')).toBe('20pz')
  })
  it('gestisce um mancante', () => {
    expect(quantitaLabel(5, '')).toBe('5')
    expect(quantitaLabel(5, undefined)).toBe('5')
  })
})

describe('risolviDestinazione', () => {
  const snap = { denominazione: 'Dott.ssa Astolfi Silvia', indirizzo: 'Via Fonte Regina 28' }
  it('usa clienteSnapshot se destinazione è null', () => {
    expect(risolviDestinazione({ clienteSnapshot: snap, destinazione: null })).toEqual(snap)
  })
  it('usa destinazione se presente', () => {
    const dest = { denominazione: 'Altro' }
    expect(risolviDestinazione({ clienteSnapshot: snap, destinazione: dest })).toEqual(dest)
  })
})

describe('fatturaToProps', () => {
  const doc = {
    numeroFormattato: '009/2024',
    data: '29/12/2024',
    pagamento: 'A vista fattura',
    scadenze: null,
    clienteSnapshot: {
      denominazione: 'Dott.ssa Astolfi Silvia', indirizzo: 'Via Fonte Regina 28',
      cap: '64100', citta: 'Teramo', prov: 'TE',
      cf: 'STLSLV78S42L103M', piva: '01682660673',
    },
    destinazione: null,
    righe: [
      { cod: '0029', descrizione: 'Riparazione', qta: 1, um: 'pz', prezzo: 30, sconto: 0 },
      { cod: '0030', descrizione: 'Aggiunta dente', qta: 5, um: 'pz', prezzo: 35, sconto: 0 },
      { cod: '0031', descrizione: 'Aggiunta gancio', qta: 1, um: 'pz', prezzo: 30, sconto: 0 },
      { cod: '0041', descrizione: 'Mascherina', qta: 20, um: 'pz', prezzo: 25, sconto: 0 },
    ],
    totaleFuoriCampo: 735, bollo: 2, totale: 737,
  }

  it('mappa intestazione documento', () => {
    const p = fatturaToProps(doc)
    expect(p.numero).toBe('009/2024')
    expect(p.data).toBe('29/12/2024')
    expect(p.pagamento).toBe('A vista fattura')
  })

  it('formatta righe con importo, prezzo e iva FC', () => {
    const p = fatturaToProps(doc)
    expect(p.righe).toHaveLength(4)
    expect(p.righe[1]).toMatchObject({
      cod: '0030', descrizione: 'Aggiunta dente',
      quantita: '5pz', prezzo: '€ 35,000', sconto: '', importo: '€ 175,00', iva: 'FC',
    })
  })

  it('formatta i totali come l’esempio', () => {
    const p = fatturaToProps(doc)
    expect(p.totali.imponibile).toBe('€ 0,00')
    expect(p.totali.imposta).toBe('€ 0,00')
    expect(p.totali.fuoriCampo).toBe('€ 735,00')
    expect(p.totali.bollo).toBe('€ 2,00')
    expect(p.totali.documento).toBe('€ 737,00')
  })

  it('destinatario e destinazione coincidono quando destinazione è null', () => {
    const p = fatturaToProps(doc)
    expect(p.destinazione).toEqual(p.destinatario)
    expect(p.destinatario.denominazione).toBe('Dott.ssa Astolfi Silvia')
  })
})
