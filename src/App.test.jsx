import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('./lib/auth.js', () => ({
  useAuth: () => ({ user: null, loading: false }),
  logout: vi.fn(),
}))

describe('App auth gate', () => {
  it('shows login when no user', async () => {
    const { default: App } = await import('./App.jsx')
    render(<App />)
    expect(screen.getAllByText(/Accedi/i).length).toBeGreaterThan(0)
  })
})
