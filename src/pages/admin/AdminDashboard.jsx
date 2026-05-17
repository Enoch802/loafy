import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAllCustomers, getAllTransactionsByDate, getTransactionsByDateRange } from '../../lib/supabase'
import { formatNaira, today, formatDate } from '../../lib/products'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function AdminDashboard() {
  const bakeryName = useAdminGuard()
  const navigate = useNavigate()
  const [todayStats, setTodayStats] = useState({ sold: 0, collected: 0, debt: 0, visits: 0 })
  const [weekStats, setWeekStats] = useState({ sold: 0, collected: 0, debt: 0 })
  const [customers, setCustomers] = useState([])
  const [topDebtors, setTopDebtors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [custs, todayTxs] = await Promise.all([
        getAllCustomers(),
        getAllTransactionsByDate(today()),
      ])
      setCustomers(custs)
      setTopDebtors([...custs].filter(c => c.total_debt > 0).sort((a, b) => b.total_debt - a.total_debt).slice(0, 5))

      setTodayStats({
        sold: todayTxs.reduce((s, t) => s + Number(t.total_amount), 0),
        collected: todayTxs.reduce((s, t) => s + Number(t.amount_paid), 0),
        debt: todayTxs.reduce((s, t) => s + Number(t.debt_for_visit), 0),
        visits: todayTxs.length,
      })

      const from = new Date(); from.setDate(from.getDate() - 7)
      const weekTxs = await getTransactionsByDateRange(from.toISOString().split('T')[0], today())
      setWeekStats({
        sold: weekTxs.reduce((s, t) => s + Number(t.total_amount), 0),
        collected: weekTxs.reduce((s, t) => s + Number(t.amount_paid), 0),
        debt: weekTxs.reduce((s, t) => s + Number(t.debt_for_visit), 0),
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const totalDebt = customers.reduce((s, c) => s + Number(c.total_debt || 0), 0)

  return (
    <AdminLayout title="Dashboard" bakeryName={bakeryName}>
      <div className="stack stack-xl fade-in">

        <div>
          <h2>{bakeryName}</h2>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>{formatDate(today())} · Admin Dashboard</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Today */}
            <div>
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>Today's Summary</div>
              <div className="stat-grid">
                <div className="stat-card brown"><div className="stat-label">Visits</div><div className="stat-value">{todayStats.visits}</div><div className="stat-sub">total deliveries</div></div>
                <div className="stat-card amber"><div className="stat-label">Revenue</div><div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatNaira(todayStats.sold)}</div><div className="stat-sub">goods delivered</div></div>
                <div className="stat-card success"><div className="stat-label">Collected</div><div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatNaira(todayStats.collected)}</div><div className="stat-sub">cash received</div></div>
                <div className="stat-card danger"><div className="stat-label">New Debt</div><div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatNaira(todayStats.debt)}</div><div className="stat-sub">unpaid today</div></div>
              </div>
            </div>

            {/* Week + Overall */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="card card-padded">
                <div className="section-title" style={{ marginBottom: '0.75rem' }}>Last 7 Days</div>
                <div className="stack stack-sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">Revenue</span>
                    <span className="font-bold text-amber">{formatNaira(weekStats.sold)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">Collected</span>
                    <span className="font-bold text-success">{formatNaira(weekStats.collected)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">Debt Added</span>
                    <span className="font-bold text-danger">{formatNaira(weekStats.debt)}</span>
                  </div>
                </div>
              </div>

              <div className="card card-padded">
                <div className="section-title" style={{ marginBottom: '0.75rem' }}>Overall</div>
                <div className="stack stack-sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">Customers</span>
                    <span className="font-bold">{customers.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">With Debt</span>
                    <span className="font-bold text-danger">{customers.filter(c => c.total_debt > 0).length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span className="text-muted">Total Debt</span>
                    <span className="font-bold text-danger">{formatNaira(totalDebt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Debtors */}
            {topDebtors.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="section-title">Top Debtors</div>
                  <Link to="/admin/customers" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>View all →</Link>
                </div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>ID</th>
                        <th style={{ textAlign: 'right' }}>Debt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDebtors.map(c => (
                        <tr key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div className="customer-avatar" style={{ width: 30, height: 30, fontSize: '0.72rem' }}>{getInitials(c.name)}</div>
                              <span className="font-semibold" style={{ fontSize: '0.875rem' }}>{c.name}</span>
                            </div>
                          </td>
                          <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--brown-500)' }}>{c.customer_code}</span></td>
                          <td style={{ textAlign: 'right' }}><span className="font-bold text-danger">{formatNaira(c.total_debt)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
