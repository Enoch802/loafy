import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-header">
        <div className="auth-logo">🍞</div>
        <h1 className="auth-title">Loafy</h1>
        <p className="auth-subtitle">Bakery Delivery Management</p>
      </div>

      <div className="auth-card slide-up">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Sign In</h2>
        <form onSubmit={handleLogin} className="stack stack-md">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <div className="auth-footer">
        Don't have an account?{' '}
        <Link to="/register">Create one</Link>
      </div>

      <div className="auth-footer" style={{ marginTop: '0.5rem' }}>
        <Link to="/admin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
          Admin Panel →
        </Link>
      </div>
    </div>
  )
}
