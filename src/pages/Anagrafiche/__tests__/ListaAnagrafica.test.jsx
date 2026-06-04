import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const listAll = vi.fn(() => Promise.resolve([
  { id: '0004', cod: '0004', denominazione: 'Dott. CIARDELLI', citta: 'Teramo' },
  { id: '0005', cod: '0005', denominazione: 'Dott. MARINI', citta: 'Teramo' },
]))
vi.mock('../../../lib/db/anagrafiche.js', () => ({ listAll: (...a) => listAll(...a) }))

import ListaAnagrafica from '../ListaAnagrafica.jsx'

describe('ListaAnagrafica', () => {
  it('loads and renders rows for the given kind', async () => {
    render(<ListaAnagrafica kind="clienti" columns={['cod', 'denominazione', 'citta']} />)
    await waitFor(() => expect(screen.getByText('Dott. CIARDELLI')).toBeInTheDocument())
    expect(listAll).toHaveBeenCalledWith('clienti')
    expect(screen.getByText('Dott. MARINI')).toBeInTheDocument()
  })

  it('filters rows by the search box', async () => {
    render(<ListaAnagrafica kind="clienti" columns={['cod', 'denominazione', 'citta']} />)
    await waitFor(() => screen.getByText('Dott. CIARDELLI'))
    fireEvent.change(screen.getByPlaceholderText(/cerca/i), { target: { value: 'MARINI' } })
    await waitFor(() => expect(screen.queryByText('Dott. CIARDELLI')).not.toBeInTheDocument())
    expect(screen.getByText('Dott. MARINI')).toBeInTheDocument()
  })
})
