import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../context/OnlineContext'
import { getTransactionsByDeliverer } from '../lib/supabase'
import { getAllLocalTransactionsByDate } from '../lib/db'
import { formatNaira, formatTime, formatItems, today } from '../lib/products'

export default function SummaryPage() {
  const { user } = useAuth()
  const isOnline = useOnline()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const todayStr = today()

  useEffect(() => { loadSummary() }, [user])

  async function loadSummary() {
    if (!user) return
    try {
      let txs = []
      if (isOnline) {
        txs = await getTransactionsByDeliverer(user.id, todayStr)
      } else {
        txs = await getAllLocalTransactionsByDate(todayStr, user.id)
      }
      setTransactions(txs)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const totalSold = transactions.reduce((s, t) => s + Number(t.total_amount), 0)
  const totalCollected = transactions.reduce((s, t) => s + Number(t.amount_paid), 0)
  const totalDebt = transactions.reduce((s, t) => s + Number(t.debt_for_visit), 0)

  const byCustomer = transactions.reduce((acc, tx) => {
    const key = tx.customer_id
    if (!acc[key]) acc[key] = {
      name: tx.customers?.name || 'Unknown',
      code: tx.customers?.customer_code || '',
      visits: []
    }
    acc[key].visits.push(tx)
    return acc
  }, {})

  const dayLabel = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Layout title="My Day" subtitle={dayLabel}>
      <div className="page-content stack stack-xl" style={{ paddingTop: '1.25rem' }}>

        {/* Day Totals */}
        <div>
          <div className="section-header">
            <span className="section-title">Day Totals</span>
            <button className="btn btn-ghost btn-sm" onClick={loadSummary} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>↻ Refresh</button>
          </div>
          <div className="stat-grid">
            <div className="stat-card brown">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{Object.keys(byCustomer).length}</div>
              <div className="stat-sub">{transactions.length} total visits</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-label">Sold</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatNaira(totalSold)}</div>
              <div className="stat-sub">total value</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Collected</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatNaira(totalCollected)}</div>
              <div className="stat-sub">cash received</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">Debt</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatNaira(totalDebt)}</div>
              <div className="stat-sub">unpaid today</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌅</div>
            <div className="empty-title">No transactions yet today</div>
            <div className="empty-desc">Start by searching for a customer</div>
          </div>
        ) : (
          <div>
            <div className="section-title" style={{ marginBottom: '0.65rem' }}>
              Breakdown by Customer
            </div>
            <div className="stack stack-md fade-in">
              {Object.values(byCustomer).map(({ name, code, visits }) => {
                const cTotal = visits.reduce((s, v) => s + Number(v.total_amount), 0)
                const cPaid = visits.reduce((s, v) => s + Number(v.amount_paid), 0)
                const cDebt = visits.reduce((s, v) => s + Number(v.debt_for_visit), 0)
                return (
                  <div key={code} className="card card-padded">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <div>
                        <div className="font-semibold" style={{ fontSize: '0.9375rem' }}>{name}</div>
                        <div className="text-xs text-muted">{code} · {visits.length} visit{visits.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-bold" style={{ color: 'var(--brown-800)' }}>{formatNaira(cTotal)}</div>
                        <div className={`text-xs font-semibold ${cDebt > 0 ? 'text-danger' : 'text-success'}`}>
                          {cDebt > 0 ? `Debt: ${formatNaira(cDebt)}` : '✓ Cleared'}
                        </div>
                      </div>
                    </div>
                    <div className="divider" style={{ margin: '0 0 0.5rem' }} />
                    <div className="stack stack-sm">
                      {visits.map((v, i) => (
                        <div key={v.id || v.local_id} style={{ fontSize: '0.8rem', color: 'var(--brown-500)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <span style={{ color: 'var(--brown-400)', fontWeight: 500 }}>{formatTime(v.created_at)}</span>
                            <span style={{ margin: '0 0.35rem' }}>·</span>
                            <span>{formatItems(v.items)}</span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span className="text-success" style={{ fontWeight: 600 }}>₦{Number(v.amount_paid).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ paddingBottom: '1rem' }} />
      </div>
    </Layout>
  )
}
