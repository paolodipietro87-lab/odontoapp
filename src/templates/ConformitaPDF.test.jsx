import { describe, it, expect } from 'vitest'
import ConformitaPDF from './ConformitaPDF.jsx'

const doc = {
  data: '11-11-21', dataConsegna: '11-12-21', prescrizioneMedicaDel: '11-11-21',
  paziente: 'Botticelli Angela', descrizioneDispositivo: '4 corone provvisorie',
  terminiUtilizzazione: '', avvertenze: '', prodottiConsigliati: '', noteParticolari: '',
  clienteSnapshot: {
    denominazione: 'Dott. Pascquale Sacripante', indirizzo: 'Via M. Capuani',
    cap: '64100', citta: 'Teramo', prov: 'TE', cf: 'SCRPQL62C10C517H', piva: '00731940672',
  },
  materiali: [{ tipo: 'Ivoclar-vivadent Ivocron', fabbricante: 'Ivoclar-vivadent', modello: 'Ivocron', lotto: 'J14491' }],
}

describe('ConformitaPDF', () => {
  it('si istanzia con intestazione senza lanciare', () => {
    expect(() => ConformitaPDF({ conformita: doc, intestazione: true })).not.toThrow()
  })
  it('si istanzia senza intestazione senza lanciare', () => {
    expect(() => ConformitaPDF({ conformita: doc, intestazione: false })).not.toThrow()
  })
})
