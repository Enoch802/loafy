import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getDelivererProfile, getDelivererStats, getTransactionsByDelivererRange } from '../../lib/supabase'
import { formatNaira, today, formatDate } from '../../lib/products'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function getPast7Days() {
  const end = today()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  return { from: start.toISOString().split('T')[0], to: end }
}

function getPast30Days() {
  const end = today()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return { from: start.toISOString().split('T')[0], to: end }
}

export default function AdminDelivererDetail() {
  const bakeryName = useAdminGuard()
  const { id } = useParams()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [todayStats, setTodayStats] = useState({ visits: 0, sold: 0, collected: 0, debt: 0 })
  const [weekStats, setWeekStats] = useState({ visits: 0, sold: 0, collected: 0, debt: 0 })
  const [monthStats, setMonthStats] = useState({ visits: 0, sold: 0, collected: 0, debt: 0 })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(today())

  useEffect(() => { loadAll() }, [id])
  useEffect(() => { loadTransactions() }, [id, dateFilter])

  async function loadAll() {
    try {
      const [prof, tStats, wStats, mStats] = await Promise.all([
        getDelivererProfile(id),
        getDelivererStats(id, today()),
        getDelivererStats(id, ...Object.values(getPast7Days())),
        getDelivererStats(id, ...Object.values(getPast30Days())),
      ])
      setProfile(prof)
      setTodayStats(tStats || { visits: 0, sold: 0, collected: 0, debt: 0 })
      setWeekStats(wStats || { visits: 0, sold: 0, collected: 0, debt: 0 })
      setMonthStats(mStats || { visits: 0, sold: 0, collected: 0, debt: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTransactions() {
    try {
      const txs = await getTransactionsByDelivererRange(id, dateFilter, dateFilter)
      setTransactions(txs)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Deliverer" bakeryName={bakeryName}>
        <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
      </AdminLayout>
    )
  }

  if (!profile) {
    return (
      <AdminLayout title="Deliverer" bakeryName={bakeryName}>
        <div className="card card-padded" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="font-semibold">Deliverer not found</p>
          <Link to="/admin/deliverers" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>← Back</Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={profile.full_name} bakeryName={bakeryName}>
      <div className="stack stack-xl fade-in">

        {/* Back + Header */}
        <div>
          <button onClick={() => navigate('/admin/deliverers')} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>
            ← All Deliverers
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="customer-avatar" style={{ width: 56, height: 56, fontSize: '1.25rem', flexShrink: 0 }}>
              {getInitials(profile.full_name)}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{profile.full_name}</h2>
              <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>{profile.email}</p>
              <p className="text-muted text-sm">Joined {formatDate(profile.created_at?.split('T')[0] || today())}</p>
            </div>
          </div>
        </div>

        {/* Stats tabs */}
        <div>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { label: 'Today', s: todayStats },
              { label: '7 Days', s: weekStats },
              { label: '30 Days', s: monthStats },
            ].map(({ label, s }) => (
              <div key={label} className="card card-padded" style={{ padding: '0.85rem' }}>
                <div className="section-title" style={{ marginBottom: '0.6rem', fontSize: '0.72rem' }}>{label}</div>
                <div className="stack stack-sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span className="text-muted">Visits</span>
                    <span className="font-bold">{s.visits}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span className="text-muted">Revenue</span>
                    <span className="font-bold" style={{ color: 'var(--brown-600)' }}>{formatNaira(s.sold)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span className="text-muted">Collected</span>
                    <span className="font-bold text-success">{formatNaira(s.collected)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span className="text-muted">Debt</span>
                    <span className="font-bold text-danger">{formatNaira(s.debt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions for a date */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div className="section-title">Transactions</div>
            <input
              type="date"
              value={dateFilter}
              max={today()}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                border: '1px solid var(--brown-200)', borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--brown-700)',
                background: 'var(--white)',
              }}
            />
          </div>

          {transactions.length === 0 ? (
            <div className="card card-padded" style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="text-muted text-sm">No transactions on {formatDate(dateFilter)}</p>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th style={{ textAlign: 'right' }}>Sold</th>
                    <th style={{ textAlign: 'right' }}>Paid</th>
                    <th style={{ textAlign: 'right' }}>Debt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} onClick={() => navigate(`/admin/customers/${tx.customer_id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="font-semibold" style={{ fontSize: '0.875rem' }}>
                          {tx.customers?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--brown-400)', fontFamily: 'monospace' }}>
                          {tx.customers?.customer_code}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brown-700)' }}>
                          {formatNaira(tx.total_amount)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-bold text-success" style={{ fontSize: '0.875rem' }}>
                          {formatNaira(tx.amount_paid)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-bold text-danger" style={{ fontSize: '0.875rem' }}>
                          {formatNaira(tx.debt_for_visit)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--cream-100)' }}>
                    <td className="font-bold" style={{ fontSize: '0.875rem' }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>
                      {formatNaira(transactions.reduce((s, t) => s + Number(t.total_amount), 0))}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: 'var(--green-600, #16a34a)' }}>
                      {formatNaira(transactions.reduce((s, t) => s + Number(t.amount_paid), 0))}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: 'var(--red-500, #ef4444)' }}>
                      {formatNaira(transactions.reduce((s, t) => s + Number(t.debt_for_visit), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}
