import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const handlers = {}
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, cb) => { handlers.cb = cb; return () => {} },
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('../firebase.js', () => ({ auth: {} }))

describe('useAuth', () => {
  beforeEach(() => { handlers.cb = undefined })

  it('reports user after auth state change', async () => {
    const { useAuth } = await import('../auth.js')
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    handlers.cb({ email: 'pietro@test.it' })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user.email).toBe('pietro@test.it')
  })
})
