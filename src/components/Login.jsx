import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        const next = params.get('next') || '/'
        navigate(next, { replace: true })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Niepoprawne hasło')
      }
    } catch {
      setError('Coś poszło nie tak')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-sm border border-gray-200 rounded-2xl p-8 w-full max-w-sm space-y-5"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">SimpleCRM</h1>
          <p className="text-sm text-gray-500">Wpisz hasło, żeby kontynuować.</p>
        </div>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loguję…' : 'Zaloguj'}
        </button>
      </form>
    </div>
  )
}
