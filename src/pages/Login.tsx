import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session } = useAuth()

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-bg-surface p-8 rounded-radius-lg shadow-modal border border-border">
        <div className="mb-8 text-center">
          <h1 className="text-display text-text-primary mb-2">Noord CRM</h1>
          <p className="text-body text-text-secondary">Autenticação restrita</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-label text-text-secondary mb-1 uppercase tracking-wider" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-9 bg-bg-surface border border-border rounded-radius-md px-3 text-body text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-[rgba(26,158,110,0.12)] focus:outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-label text-text-secondary mb-1 uppercase tracking-wider" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-9 bg-bg-surface border border-border rounded-radius-md px-3 text-body text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-[rgba(26,158,110,0.12)] focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-small text-status-red bg-[#FEE2E2] px-3 py-2 rounded-radius-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white h-9 rounded-radius-md text-body-lg font-semibold hover:bg-accent-hover disabled:opacity-50 transition-all flex items-center justify-center mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
