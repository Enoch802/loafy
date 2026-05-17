import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getNotifications, markNotificationRead } from '../../lib/supabase'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminNotifications() {
  const bakeryName = useAdminGuard()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadNotifications() }, [])

  async function loadNotifications() {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch { } finally { setLoading(false) }
  }

  async function handleRead(id) {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function handleMarkAllRead() {
    await Promise.all(notifications.filter(n => !n.is_read).map(n => markNotificationRead(n.id)))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifications.filter(n => !n.is_read).length

  const typeConfig = {
    new_customer: { emoji: '👤', label: 'New Customer', color: 'var(--info)' },
    debt_alert: { emoji: '⚠️', label: 'Debt Alert', color: 'var(--danger-mid)' },
    default: { emoji: '🔔', label: 'Notification', color: 'var(--amber)' },
  }

  return (
    <AdminLayout title="Notifications" bakeryName={bakeryName}>
      <div className="stack stack-lg fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Notifications {unread > 0 && <span className="badge badge-danger" style={{ verticalAlign: 'middle' }}>{unread}</span>}</h2>
          {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>Mark all read</button>}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div> : notifications.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔔</div><div className="empty-title">No notifications yet</div></div>
        ) : (
          <div className="stack stack-sm">
            {notifications.map(n => {
              const config = typeConfig[n.type] || typeConfig.default
              return (
                <div key={n.id} className="card card-padded" style={{ borderLeft: `4px solid ${config.color}`, opacity: n.is_read ? 0.65 : 1 }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{config.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</span>
                        <span className="text-xs text-muted">{timeAgo(n.created_at)}</span>
                      </div>
                      <div className="text-sm">{n.message}</div>
                      {n.customers && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: '0.4rem', padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                          onClick={() => navigate(`/admin/customers/${n.customer_id}`)}
                        >
                          View Customer →
                        </button>
                      )}
                    </div>
                    {!n.is_read && (
                      <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleRead(n.id)}>
                        ✓ Read
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
