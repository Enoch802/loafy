import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OfflineBanner from './OfflineBanner'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
)
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

export default function Layout({ children, title, subtitle, back }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const tabs = [
    { path: '/dashboard', label: 'Home', Icon: HomeIcon },
    { path: '/search', label: 'Search', Icon: SearchIcon },
    { path: '/summary', label: 'My Day', Icon: ClipboardIcon },
    { path: '/account', label: 'Account', Icon: UserIcon },
  ]

  return (
    <div className="page">
      <OfflineBanner />
      <div className="topbar">
        <div className="topbar-brand">
          {back ? (
            <button className="btn btn-ghost btn-icon" onClick={() => navigate(back)} style={{ color: 'white', marginRight: '0.25rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          ) : (
            <div className="topbar-logo">🍞</div>
          )}
          <div>
            <div className="topbar-title">{title || 'Loafy'}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem', fontWeight: 500 }}>
          {profile?.full_name || ''}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>

      <nav className="bottom-nav">
        {tabs.map(({ path, label, Icon }) => (
          <Link
            key={path}
            to={path}
            className={`bottom-nav-item${location.pathname === path ? ' active' : ''}`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
