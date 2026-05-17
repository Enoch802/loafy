import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', emoji: '📊' },
  { path: '/admin/customers', label: 'Customers', emoji: '👥' },
  { path: '/admin/deliverers', label: 'Deliverers', emoji: '🚚' },
  { path: '/admin/financials', label: 'Financials', emoji: '💰' },
  { path: '/admin/insights', label: 'AI Insights', emoji: '🤖' },
  { path: '/admin/notifications', label: 'Notifications', emoji: '🔔' },
]

export default function AdminLayout({ children, title, bakeryName }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    sessionStorage.removeItem('admin_auth')
    navigate('/admin')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Desktop Sidebar */}
      <aside className="admin-nav">
        <div className="admin-nav-brand">
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🍞</div>
          <h2>Loafy</h2>
          <p>{bakeryName || 'Admin Panel'}</p>
        </div>

        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-nav-item${location.pathname.startsWith(item.path) ? ' active' : ''}`}
          >
            <span style={{ fontSize: '1rem' }}>{item.emoji}</span>
            {item.label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />
        <button className="admin-nav-item" onClick={handleLogout} style={{ marginTop: 'auto', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: '1rem' }}>🚪</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-content" style={{ flex: 1 }}>
        {/* Mobile Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'var(--white)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🍞</span>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--brown-800)', fontSize: '1rem' }}>
                {title || 'Admin'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--brown-400)' }}>{bakeryName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '0.4rem', marginBottom: '1rem', paddingBottom: '0.25rem' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
                padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none',
                background: location.pathname.startsWith(item.path) ? 'var(--brown-600)' : 'var(--cream-200)',
                color: location.pathname.startsWith(item.path) ? 'white' : 'var(--brown-500)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {item.emoji} {item.label}
            </Link>
          ))}
        </div>

        {children}
      </main>
    </div>
  )
}
