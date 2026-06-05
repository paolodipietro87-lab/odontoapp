import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../services/excel.js', () => ({
  parseAnagrafica: vi.fn(() => [
    { cod: '0004', denominazione: 'Dott. CIARDELLI' },
    { cod: '0005', denominazione: 'Dott. MARINI' },
  ]),
  dedupByCod: (rows) => rows,
}))
const importRows = vi.fn(() => Promise.resolve(2))
vi.mock('../../../lib/db/anagrafiche.js', () => ({ importRows: (...a) => importRows(...a) }))

import ImportPage from '../ImportPage.jsx'

function uploadFile() {
  const input = screen.getByLabelText(/file excel/i)
  const file = new File([new ArrayBuffer(8)], 'clienti.xlsx')
  file.arrayBuffer = () => Promise.resolve(new ArrayBuffer(8))
  fireEvent.change(input, { target: { files: [file] } })
}

describe('ImportPage', () => {
  it('previews parsed rows after file upload', async () => {
    render(<MemoryRouter><ImportPage /></MemoryRouter>)
    uploadFile()
    await waitFor(() => expect(screen.getByText(/2 righe/i)).toBeInTheDocument())
    expect(screen.getByText(/Dott. CIARDELLI/)).toBeInTheDocument()
  })

  it('writes rows to Firestore on confirm', async () => {
    render(<MemoryRouter><ImportPage /></MemoryRouter>)
    uploadFile()
    await waitFor(() => screen.getByText(/2 righe/i))
    fireEvent.click(screen.getByRole('button', { name: /conferma import/i }))
    await waitFor(() => expect(importRows).toHaveBeenCalledWith('clienti', expect.any(Array)))
    expect(await screen.findByText(/import completato/i)).toBeInTheDocument()
  })
})
