import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings } from '../../lib/supabase'
import { verifyPassword } from '../../lib/sync'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Already logged in?
    if (sessionStorage.getItem('admin_auth') === 'true') {
      navigate('/admin/dashboard')
      return
    }
    getSettings().then(setSettings).catch(() => {})
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    try {
      if (!settings) throw new Error('Could not load settings. Please check your connection.')
      const valid = await verifyPassword(password, settings.admin_password_hash)
      if (!valid) throw new Error('Incorrect password')
      sessionStorage.setItem('admin_auth', 'true')
      sessionStorage.setItem('bakery_name', settings.bakery_name)
      toast.success(`Welcome back, Admin!`)
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-header">
        <div className="auth-logo" style={{ background: 'var(--brown-800)' }}>🔐</div>
        <h1 className="auth-title">Admin Panel</h1>
        <p className="auth-subtitle">Loafy Bakery Management</p>
      </div>

      <div className="auth-card slide-up">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Enter Admin Password</h2>
        <form onSubmit={handleLogin} className="stack stack-md">
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input form-input-lg"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Access Admin Panel →'}
          </button>
        </form>
      </div>

      <div className="auth-footer" style={{ marginTop: '1rem' }}>
        <button
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/login')}
        >
          ← Back to Deliverer Login
        </button>
      </div>
    </div>
  )
}
