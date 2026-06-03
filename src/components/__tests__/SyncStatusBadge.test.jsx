import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SyncStatusBadge from '../SyncStatusBadge.jsx'

describe('SyncStatusBadge', () => {
  it('shows offline when navigator is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(<SyncStatusBadge />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('shows online when navigator is online', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    render(<SyncStatusBadge />)
    expect(screen.getByText(/online/i)).toBeInTheDocument()
  })
})
