import { useState } from 'react'
import { saveSettings } from '../lib/supabase'
import { hashPassword } from '../lib/sync'
import toast from 'react-hot-toast'

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(1)
  const [bakeryName, setBakeryName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const hash = await hashPassword(password)
      await saveSettings({ bakery_name: bakeryName.trim(), admin_password_hash: hash, setup_complete: true })
      toast.success('Loafy is ready!')
      onComplete()
    } catch (err) {
      toast.error('Setup failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'center' }}>
      <div className="auth-header">
        <div className="auth-logo">🍞</div>
        <h1 className="auth-title">Welcome to Loafy</h1>
        <p className="auth-subtitle">Let's set up your bakery</p>
      </div>

      <div className="auth-card slide-up">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: step >= s ? 'var(--brown-500)' : 'var(--cream-300)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {step === 1 && (
          <div className="stack stack-lg fade-in">
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>What's your bakery called?</h3>
              <p className="text-muted text-sm">This name will appear on your dashboard</p>
            </div>
            <div className="form-group">
              <label className="form-label">Bakery Name</label>
              <input
                className="form-input form-input-lg"
                placeholder="e.g. Golden Crust Bakery"
                value={bakeryName}
                onChange={e => setBakeryName(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={() => {
                if (!bakeryName.trim()) return toast.error('Please enter your bakery name')
                setStep(2)
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="stack stack-lg fade-in">
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Create your admin password</h3>
              <p className="text-muted text-sm">You'll use this to access the admin panel</p>
            </div>
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Setting up...' : 'Launch Loafy 🍞'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
