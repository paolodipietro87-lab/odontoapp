import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ name: 'app' })) }))
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({ type: 'firestore' })),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
}))
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ type: 'auth' })) }))

describe('firebase init', () => {
  it('exports db and auth', async () => {
    const mod = await import('../firebase.js')
    expect(mod.db).toBeDefined()
    expect(mod.auth).toBeDefined()
  })
})
