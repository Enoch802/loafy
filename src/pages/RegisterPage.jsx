import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    if (!fullName || !email || !password) return toast.error('Please fill in all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signUp(email, password, fullName.trim())
      toast.success('Account created! Welcome to Loafy 🍞')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-header">
        <div className="auth-logo">🍞</div>
        <h1 className="auth-title">Loafy</h1>
        <p className="auth-subtitle">Create your deliverer account</p>
      </div>

      <div className="auth-card slide-up">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create Account</h2>
        <form onSubmit={handleRegister} className="stack stack-md">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
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
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  )
}
