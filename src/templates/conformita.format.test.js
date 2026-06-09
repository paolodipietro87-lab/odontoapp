import { describe, it, expect } from 'vitest'
import { pulisciMateriali, conformitaToProps } from './conformita.format.js'

describe('pulisciMateriali', () => {
  it('scarta le righe completamente vuote', () => {
    const out = pulisciMateriali([
      { tipo: 'Ivocron', fabbricante: 'Ivoclar', modello: 'Ivocron', lotto: 'J14491' },
      { tipo: '', fabbricante: '', modello: '', lotto: '' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({ tipo: 'Ivocron', fabbricante: 'Ivoclar', modello: 'Ivocron', lotto: 'J14491' })
  })
  it('tiene una riga se almeno un campo è valorizzato', () => {
    const out = pulisciMateriali([{ tipo: '', fabbricante: '', modello: '', lotto: 'X1' }])
    expect(out).toHaveLength(1)
  })
  it('gestisce array mancante', () => {
    expect(pulisciMateriali()).toEqual([])
  })
})

describe('conformitaToProps', () => {
  const doc = {
    data: '11-11-21',
    dataConsegna: '11-12-21',
    prescrizioneMedicaDel: '11-11-21',
    paziente: '  Botticelli Angela  ',
    descrizioneDispositivo: '4 corone provvisorie',
    terminiUtilizzazione: '',
    avvertenze: '',
    prodottiConsigliati: '',
    noteParticolari: '',
    clienteSnapshot: {
      denominazione: 'Dott. Pascquale Sacripante',
      indirizzo: 'Via M. Capuani',
      cap: '64100',
      citta: 'Teramo',
      prov: 'TE',
      cf: 'SCRPQL62C10C517H',
      piva: '00731940672',
    },
    materiali: [
      { tipo: 'Ivoclar-vivadent Ivocron', fabbricante: 'Ivoclar-vivadent', modello: 'Ivocron', lotto: 'J14491' },
      { tipo: '', fabbricante: '', modello: '', lotto: '' },
    ],
  }

  it('trimma il paziente', () => {
    expect(conformitaToProps(doc).paziente).toBe('Botticelli Angela')
  })
  it('mappa il prescrivente dal clienteSnapshot', () => {
    const p = conformitaToProps(doc).prescrivente
    expect(p.denominazione).toBe('Dott. Pascquale Sacripante')
    expect(p.cittaRiga).toBe('64100 Teramo (TE)')
    expect(p.cfPiva).toBe('C.F. SCRPQL62C10C517H   P.Iva 00731940672')
  })
  it('pulisce i materiali scartando le righe vuote', () => {
    expect(conformitaToProps(doc).materiali).toHaveLength(1)
  })
  it('prescrivente vuoto se clienteSnapshot manca', () => {
    const p = conformitaToProps({ ...doc, clienteSnapshot: null }).prescrivente
    expect(p.denominazione).toBe('')
  })
})

describe('materiali nel PDF non includono dati magazzino', () => {
  it('pulisciMateriali scarta qta e prodottoId', () => {
    const out = pulisciMateriali([{ tipo: 'Resina', fabbricante: 'Ivoclar', modello: 'X', lotto: 'L1', qta: 5, prodottoId: 'P1' }])
    expect(out).toEqual([{ tipo: 'Resina', fabbricante: 'Ivoclar', modello: 'X', lotto: 'L1' }])
  })
  it('conformitaToProps non espone qta/prodottoId', () => {
    const props = conformitaToProps({ materiali: [{ tipo: 'A', qta: 2, prodottoId: 'P' }] })
    expect(props.materiali[0]).not.toHaveProperty('qta')
    expect(props.materiali[0]).not.toHaveProperty('prodottoId')
  })
})
