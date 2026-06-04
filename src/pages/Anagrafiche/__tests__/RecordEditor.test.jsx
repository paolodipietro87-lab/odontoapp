import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RecordEditor from '../RecordEditor.jsx'

describe('RecordEditor', () => {
  it('creates a new record: cod editable, calls onSave with values', async () => {
    const onSave = vi.fn(() => Promise.resolve())
    render(<RecordEditor kind="clienti" record={null} onSave={onSave} onCancel={() => {}} />)
    const cod = screen.getByLabelText('Codice')
    expect(cod).not.toBeDisabled()
    fireEvent.change(cod, { target: { value: '0099' } })
    fireEvent.change(screen.getByLabelText('Denominazione'), { target: { value: 'Nuovo Cliente' } })
    fireEvent.click(screen.getByRole('button', { name: /salva/i }))
    await waitFor(() => expect(onSave).toHaveBeenCalled())
    const saved = onSave.mock.calls[0][0]
    expect(saved.cod).toBe('0099')
    expect(saved.denominazione).toBe('Nuovo Cliente')
  })

  it('editing existing record: cod is read-only', () => {
    render(<RecordEditor kind="clienti" record={{ cod: '0004', denominazione: 'A' }} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText('Codice')).toBeDisabled()
    expect(screen.getByLabelText('Denominazione')).toHaveValue('A')
  })

  it('blocks save when cod empty on new record', async () => {
    const onSave = vi.fn()
    render(<RecordEditor kind="clienti" record={null} onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /salva/i }))
    expect(await screen.findByText(/codice obbligatorio/i)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
