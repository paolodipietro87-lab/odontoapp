import { describe, it, expect } from 'vitest'
import { formattaNumero } from '../progressivo.js'

describe('formattaNumero', () => {
  it('zero-pads to 3 digits', () => {
    expect(formattaNumero(1, 2026)).toBe('001/2026')
    expect(formattaNumero(12, 2026)).toBe('012/2026')
    expect(formattaNumero(123, 2026)).toBe('123/2026')
  })
  it('keeps 4+ digit numbers as-is', () => {
    expect(formattaNumero(1234, 2026)).toBe('1234/2026')
  })
})
