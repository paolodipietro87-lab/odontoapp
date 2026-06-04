import { describe, it, expect } from 'vitest'
import FatturaPDF from './FatturaPDF.jsx'

describe('FatturaPDF', () => {
  it('è un componente che si crea senza errori con props minime', () => {
    const fattura = {
      numeroFormattato: '001/2026', data: '01/01/2026', pagamento: 'A vista fattura',
      clienteSnapshot: { denominazione: 'Test', indirizzo: '', cap: '', citta: '', prov: '', cf: '', piva: '' },
      destinazione: null, righe: [], totaleFuoriCampo: 0, bollo: 0, totale: 0,
    }
    expect(() => FatturaPDF({ fattura })).not.toThrow()
  })
})
