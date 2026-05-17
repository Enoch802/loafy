import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAllDeliverers, getDelivererStats } from '../../lib/supabase'
import { formatNaira, today } from '../../lib/products'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function AdminDeliverers() {
  const bakeryName = useAdminGuard()
  const navigate = useNavigate()
  const [deliverers, setDeliverers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const list = await getAllDeliverers()
      setDeliverers(list)

      // Load today's stats for each deliverer in parallel
      const statsResults = await Promise.all(
        list.map(async (d) => {
          const s = await getDelivererStats(d.id, today())
          return [d.id, s]
        })
      )
      setStats(Object.fromEntries(statsResults))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Deliverers" bakeryName={bakeryName}>
      <div className="stack stack-xl fade-in">

        <div>
          <h2>Deliverers</h2>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
            {deliverers.length} active deliverer{deliverers.length !== 1 ? 's' : ''} · Today's performance
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : deliverers.length === 0 ? (
          <div className="card card-padded" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚚</div>
            <p className="font-semibold">No deliverers yet</p>
            <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>
              Deliverers will appear here once they register and make their first transaction.
            </p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="stat-grid">
              <div className="stat-card brown">
                <div className="stat-label">Total Deliverers</div>
                <div className="stat-value">{deliverers.length}</div>
                <div className="stat-sub">registered</div>
              </div>
              <div className="stat-card amber">
                <div className="stat-label">Active Today</div>
                <div className="stat-value">
                  {deliverers.filter(d => (stats[d.id]?.visits || 0) > 0).length}
                </div>
                <div className="stat-sub">made deliveries</div>
              </div>
              <div className="stat-card success">
                <div className="stat-label">Total Collected</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                  {formatNaira(Object.values(stats).reduce((s, v) => s + (v?.collected || 0), 0))}
                </div>
                <div className="stat-sub">today</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-label">Total Debt</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                  {formatNaira(Object.values(stats).reduce((s, v) => s + (v?.debt || 0), 0))}
                </div>
                <div className="stat-sub">added today</div>
              </div>
            </div>

            {/* Deliverer cards */}
            <div className="stack stack-sm">
              <div className="section-title" style={{ marginBottom: '0.5rem' }}>All Deliverers</div>
              {deliverers.map(d => {
                const s = stats[d.id] || { visits: 0, sold: 0, collected: 0, debt: 0 }
                const isActive = s.visits > 0
                return (
                  <div
                    key={d.id}
                    className="card card-padded"
                    onClick={() => navigate(`/admin/deliverers/${d.id}`)}
                    style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      {/* Left — avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                        <div className="customer-avatar" style={{ width: 44, height: 44, fontSize: '1rem', flexShrink: 0 }}>
                          {getInitials(d.full_name)}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: 'var(--brown-800)' }}>{d.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--brown-400)', marginTop: '0.1rem' }}>
                            {d.email}
                          </div>
                          <span style={{
                            display: 'inline-block', marginTop: '0.3rem',
                            padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem', fontWeight: 600,
                            background: isActive ? 'var(--green-100, #dcfce7)' : 'var(--cream-200)',
                            color: isActive ? 'var(--green-700, #15803d)' : 'var(--brown-400)',
                          }}>
                            {isActive ? `● Active today` : '○ No deliveries today'}
                          </span>
                        </div>
                      </div>

                      {/* Right — today's stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '1.25rem', textAlign: 'center', flexShrink: 0 }}>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--brown-700)' }}>{s.visits}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--brown-400)', marginTop: '0.1rem' }}>Visits</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--amber-600, #d97706)' }}>{formatNaira(s.collected)}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--brown-400)', marginTop: '0.1rem' }}>Collected</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--red-500, #ef4444)' }}>{formatNaira(s.debt)}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--brown-400)', marginTop: '0.1rem' }}>Debt</div>
                        </div>
                      </div>

                      <span style={{ color: 'var(--brown-300)', fontSize: '1.1rem' }}>›</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
