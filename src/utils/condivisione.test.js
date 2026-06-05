import { describe, it, expect } from 'vitest'
import { nomeFileFattura, nomeFileConformita, puoCondividereFile } from './condivisione.js'

describe('nomeFileFattura', () => {
  it('formatta numero NNN-ANNO + denominazione', () => {
    expect(nomeFileFattura({ numeroFormattato: '009/2024', clienteSnapshot: { denominazione: 'Studio Rossi' } }))
      .toBe('Fattura_009-2024_Studio_Rossi.pdf')
  })
  it('tollera dati mancanti', () => {
    expect(nomeFileFattura({})).toBe('Fattura_.pdf')
  })
  it('pulisce caratteri non alfanumerici', () => {
    expect(nomeFileFattura({ numeroFormattato: '1/2026', clienteSnapshot: { denominazione: 'Dott. Bianchi & C.' } }))
      .toBe('Fattura_1-2026_Dott_Bianchi_C.pdf')
  })
})

describe('nomeFileConformita', () => {
  it('versione medico (con intestazione) senza suffix', () => {
    expect(nomeFileConformita({ data: '2024-05-01', paziente: 'Mario Bianchi' }, true))
      .toBe('Rapporto_2024-05-01_Mario_Bianchi.pdf')
  })
  it('versione paziente con suffix _paziente', () => {
    expect(nomeFileConformita({ data: '2024-05-01', paziente: 'Mario Bianchi' }, false))
      .toBe('Rapporto_2024-05-01_Mario_Bianchi_paziente.pdf')
  })
})

describe('puoCondividereFile', () => {
  it('false se navigator senza share', () => {
    expect(puoCondividereFile({}, new Blob())).toBe(false)
  })
  it('false se share c\'è ma canShare nega i file', () => {
    const nav = { share: () => {}, canShare: () => false }
    expect(puoCondividereFile(nav, {})).toBe(false)
  })
  it('true se share + canShare accettano i file', () => {
    const nav = { share: () => {}, canShare: () => true }
    expect(puoCondividereFile(nav, {})).toBe(true)
  })
  it('true se share esiste senza canShare (browser vecchi)', () => {
    const nav = { share: () => {} }
    expect(puoCondividereFile(nav, {})).toBe(true)
  })
})
