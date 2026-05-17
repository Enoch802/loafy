import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../context/OnlineContext'
import { syncPendingTransactions } from '../lib/sync'
import { getPendingTransactions } from '../lib/db'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function AccountPage() {
  const { user, profile, signOut } = useAuth()
  const isOnline = useOnline()
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    getPendingTransactions().then(txs => setPending(txs.length))
  }, [])

  async function handleSync() {
    setSyncing(true)
    await syncPendingTransactions()
    const txs = await getPendingTransactions()
    setPending(txs.length)
    setSyncing(false)
  }

  async function handleSignOut() {
    if (pending > 0) {
      const ok = window.confirm(`You have ${pending} unsynced transaction${pending > 1 ? 's' : ''}. Sign out anyway?`)
      if (!ok) return
    }
    try { await signOut() } catch (err) { toast.error(err.message) }
  }

  return (
    <Layout title="Account">
      <div className="page-content stack stack-lg" style={{ paddingTop: '1.25rem' }}>

        {/* Profile */}
        <div className="card card-padded fade-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, var(--brown-500), var(--brown-700))', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
            🧑‍🍳
          </div>
          <h3>{profile?.full_name || 'Deliverer'}</h3>
          <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>{user?.email}</p>
          <div className="badge badge-success" style={{ marginTop: '0.5rem' }}>Deliverer</div>
        </div>

        {/* Connection Status */}
        <div className="card card-padded">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Connection Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: isOnline ? 'var(--success-mid)' : 'var(--danger-mid)', flexShrink: 0 }} />
            <div>
              <div className="font-semibold">{isOnline ? 'Online' : 'Offline'}</div>
              <div className="text-sm text-muted">{isOnline ? 'Data syncing in real time' : 'Working offline — transactions saved locally'}</div>
            </div>
          </div>
        </div>

        {/* Pending Sync */}
        {pending > 0 && (
          <div className="card card-padded" style={{ borderLeft: '4px solid var(--amber)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-semibold">{pending} Pending Sync{pending > 1 ? 's' : ''}</div>
                <div className="text-sm text-muted">Transactions saved offline, not yet synced</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSync}
                disabled={syncing || !isOnline}
              >
                {syncing ? '...' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button className="btn btn-danger btn-full" onClick={handleSignOut}>
          Sign Out
        </button>

        <div style={{ paddingBottom: '1rem' }} />
      </div>
    </Layout>
  )
}
