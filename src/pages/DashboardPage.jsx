import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../context/OnlineContext'
import { getTransactionsByDeliverer } from '../lib/supabase'
import { getAllLocalTransactionsByDate } from '../lib/db'
import { formatNaira, today, formatDate } from '../lib/products'
import { refreshCustomerCache } from '../lib/sync'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const isOnline = useOnline()
  const [stats, setStats] = useState({ visits: 0, collected: 0, debt: 0, sold: 0 })
  const [loading, setLoading] = useState(true)
  const todayStr = today()

  useEffect(() => {
    if (isOnline) refreshCustomerCache()
    loadStats()
  }, [user, isOnline])

  async function loadStats() {
    if (!user) return
    try {
      let txs = []
      if (isOnline) {
        txs = await getTransactionsByDeliverer(user.id, todayStr)
      } else {
        txs = await getAllLocalTransactionsByDate(todayStr, user.id)
      }
      const visits = txs.length
      const collected = txs.reduce((s, t) => s + Number(t.amount_paid), 0)
      const debt = txs.reduce((s, t) => s + Number(t.debt_for_visit), 0)
      const sold = txs.reduce((s, t) => s + Number(t.total_amount), 0)
      setStats({ visits, collected, debt, sold })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Deliverer'

  return (
    <Layout title="Loafy" subtitle={formatDate(todayStr)}>
      <div className="page-content stack stack-xl" style={{ paddingTop: '1.5rem' }}>

        {/* Greeting */}
        <div className="fade-in">
          <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--brown-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{greeting()}</p>
          <h2 style={{ fontSize: '1.75rem' }}>{firstName} 👋</h2>
        </div>

        {/* Today's Stats */}
        <div>
          <div className="section-header">
            <span className="section-title">Today's Performance</span>
            <button className="btn btn-ghost btn-sm" onClick={loadStats} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>↻ Refresh</button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : (
            <div className="stat-grid fade-in">
              <div className="stat-card brown">
                <div className="stat-label">Visits</div>
                <div className="stat-value">{stats.visits}</div>
                <div className="stat-sub">customers seen</div>
              </div>
              <div className="stat-card amber">
                <div className="stat-label">Goods Sold</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatNaira(stats.sold)}</div>
                <div className="stat-sub">total value</div>
              </div>
              <div className="stat-card success">
                <div className="stat-label">Collected</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatNaira(stats.collected)}</div>
                <div className="stat-sub">cash in hand</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-label">Debt Today</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatNaira(stats.debt)}</div>
                <div className="stat-sub">unpaid balance</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="stack stack-sm fade-in">
            {[
              { to: '/search', emoji: '🔍', title: 'Find Customer', desc: 'Search by name or ID to record a sale', color: '#FDF2D0' },
              { to: '/add-customer', emoji: '➕', title: 'New Customer', desc: 'Register a new customer on the spot', color: '#D8F3DC' },
              { to: '/summary', emoji: '📋', title: 'My Day Summary', desc: 'View all your trips and totals for today', color: '#DBEAFE' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--white)', borderRadius: 'var(--radius-md)', padding: '0.9rem 1rem', boxShadow: 'var(--shadow-xs)', border: '1px solid var(--cream-200)', transition: 'all 0.18s' }}
              >
                <div style={{ width: 44, height: 44, background: item.color, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  {item.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-semibold" style={{ color: 'var(--brown-900)', fontSize: '0.9375rem' }}>{item.title}</div>
                  <div className="text-xs text-muted" style={{ marginTop: '0.1rem' }}>{item.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cream-400)" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ paddingBottom: '1rem' }} />
      </div>
    </Layout>
  )
}
