import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../lib/db/anagrafiche.js', () => ({
  listAll: vi.fn((kind) => Promise.resolve(
    kind === 'prodotti'
      ? [{ id: 'p1', cod: 'P1', descrizione: 'Corona', um: 'NR', listino1: 100 }]
      : [{ id: 'c1', cod: 'C1', denominazione: 'Studio Rossi', citta: 'Teramo' }],
  )),
}))
const created = { payload: null }
vi.mock('../../../lib/db/fatture.js', () => ({
  creaBozza: vi.fn((p) => { created.payload = p; return Promise.resolve('new-id') }),
  getOne: vi.fn(() => Promise.resolve(null)),
  aggiornaBozza: vi.fn(() => Promise.resolve()),
  deleteBozza: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../../services/progressivo.js', () => ({
  emettiFattura: vi.fn(() => Promise.resolve({ numeroFormattato: '001/2026' })),
}))

import EditorFattura from '../EditorFattura.jsx'
beforeEach(() => { created.payload = null })

function renderEditor() {
  return render(<MemoryRouter><EditorFattura /></MemoryRouter>)
}

describe('EditorFattura', () => {
  it('computes live totals with bollo when over threshold', async () => {
    renderEditor()
    await waitFor(() => screen.getByPlaceholderText(/Cerca cliente/i))
    const numbers = screen.getAllByRole('spinbutton')
    fireEvent.change(numbers[1], { target: { value: '100' } }) // prezzo (qta, prezzo, sconto order)
    await waitFor(() => expect(screen.getByText(/Bollo: € 2.00/)).toBeInTheDocument())
    expect(screen.getByText(/Totale documento: € 102.00/)).toBeInTheDocument()
  })

  it('Emetti is disabled until a cliente is selected', async () => {
    renderEditor()
    await waitFor(() => screen.getByPlaceholderText(/Cerca cliente/i))
    expect(screen.getByRole('button', { name: 'Emetti' })).toBeDisabled()
  })
})
