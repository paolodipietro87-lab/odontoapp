import { useState } from 'react'
import { login } from '../lib/auth.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch {
      setError('Credenziali non valide')
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-20 flex flex-col gap-3 p-6">
      <h1 className="text-xl font-bold">OdontoApp — Accedi</h1>
      <input className="border rounded p-2" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border rounded p-2" type="password" placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="bg-blue-600 text-white rounded p-2" type="submit">Accedi</button>
    </form>
  )
}
