import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ConfirmDialog from '../ConfirmDialog.jsx'

describe('ConfirmDialog', () => {
  it('renders message and calls onConfirm', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog message="Eliminare?" onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByText('Eliminare?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /elimina/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when annulla clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog message="X" onConfirm={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /annulla/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
