import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAllTransactionsByDate, getTransactionsByDateRange } from '../../lib/supabase'
import { formatNaira, today, formatDate, formatTime, formatItems } from '../../lib/products'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

export default function AdminFinancials() {
  const bakeryName = useAdminGuard()
  const [tab, setTab] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(today())
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0] })
  const [toDate, setToDate] = useState(today())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadData() }, [tab, selectedDate])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'daily') {
        const data = await getAllTransactionsByDate(selectedDate)
        setTransactions(data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadRange() {
    setLoading(true)
    try {
      const data = await getTransactionsByDateRange(fromDate, toDate)
      setTransactions(data)
    } catch { } finally { setLoading(false) }
  }

  const totalSold = transactions.reduce((s, t) => s + Number(t.total_amount), 0)
  const totalCollected = transactions.reduce((s, t) => s + Number(t.amount_paid), 0)
  const totalDebt = transactions.reduce((s, t) => s + Number(t.debt_for_visit), 0)

  // Group by deliverer
  const byDeliverer = transactions.reduce((acc, tx) => {
    const key = tx.deliverer_name || 'Unknown'
    if (!acc[key]) acc[key] = { sold: 0, collected: 0, debt: 0, count: 0 }
    acc[key].sold += Number(tx.total_amount)
    acc[key].collected += Number(tx.amount_paid)
    acc[key].debt += Number(tx.debt_for_visit)
    acc[key].count++
    return acc
  }, {})

  return (
    <AdminLayout title="Financials" bakeryName={bakeryName}>
      <div className="stack stack-lg fade-in">
        <h2>Financial Reports</h2>

        <div className="tabs">
          <button className={`tab-btn${tab === 'daily' ? ' active' : ''}`} onClick={() => setTab('daily')}>Daily</button>
          <button className={`tab-btn${tab === 'range' ? ' active' : ''}`} onClick={() => setTab('range')}>Date Range</button>
        </div>

        {tab === 'daily' && (
          <div className="form-group">
            <label className="form-label">Select Date</label>
            <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={today()} />
          </div>
        )}

        {tab === 'range' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
            <div className="form-group"><label className="form-label">From</label><input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} max={today()} /></div>
            <div className="form-group"><label className="form-label">To</label><input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} max={today()} /></div>
            <button className="btn btn-primary" style={{ gridColumn: 'span 2' }} onClick={loadRange}>Generate Report</button>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div> : (
          <>
            {/* Summary */}
            <div className="total-bar">
              <div className="total-bar-row" style={{ marginBottom: '0.5rem' }}>
                <span className="total-bar-label">Total Sold</span>
                <span className="total-bar-value">{formatNaira(totalSold)}</span>
              </div>
              <hr className="total-bar-divider" />
              <div className="total-bar-row" style={{ marginBottom: '0.5rem' }}>
                <span className="total-bar-label">Collected</span>
                <span style={{ fontWeight: 700, color: 'var(--amber-light)' }}>{formatNaira(totalCollected)}</span>
              </div>
              <div className="total-bar-row">
                <span className="total-bar-label">Debt</span>
                <span style={{ fontWeight: 700, color: '#ffaaaa' }}>{formatNaira(totalDebt)}</span>
              </div>
            </div>

            {/* By Deliverer */}
            {Object.keys(byDeliverer).length > 0 && (
              <div>
                <div className="section-title" style={{ marginBottom: '0.75rem' }}>Breakdown by Deliverer</div>
                <div className="stack stack-sm">
                  {Object.entries(byDeliverer).map(([name, stats]) => (
                    <div key={name} className="card card-padded">
                      <div className="font-semibold" style={{ marginBottom: '0.5rem' }}>🧑‍🍳 {name} <span className="text-muted text-sm">({stats.count} visits)</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', textAlign: 'center' }}>
                        <div><div className="text-xs text-muted">Sold</div><div className="font-bold text-sm">{formatNaira(stats.sold)}</div></div>
                        <div><div className="text-xs text-muted">Collected</div><div className="font-bold text-sm text-success">{formatNaira(stats.collected)}</div></div>
                        <div><div className="text-xs text-muted">Debt</div><div className={`font-bold text-sm ${stats.debt > 0 ? 'text-danger' : 'text-success'}`}>{formatNaira(stats.debt)}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction List */}
            <div>
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>All Transactions ({transactions.length})</div>
              <div className="tx-list">
                {transactions.map(tx => (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-header">
                      <div>
                        <div className="font-semibold text-sm">{tx.customers?.name}</div>
                        <div className="tx-time">{formatDate(tx.date)} · {formatTime(tx.created_at)} · {tx.deliverer_name}</div>
                      </div>
                      <div className="tx-total">{formatNaira(tx.total_amount)}</div>
                    </div>
                    <div className="tx-items">{formatItems(tx.items)}</div>
                    <div className="tx-footer">
                      <span className="text-success">Paid: {formatNaira(tx.amount_paid)}</span>
                      <span className={tx.debt_for_visit > 0 ? 'text-danger' : 'text-success'}>{tx.debt_for_visit > 0 ? `Debt: ${formatNaira(tx.debt_for_visit)}` : '✓ Cleared'}</span>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && <div className="empty-state" style={{ padding: '2rem' }}><div className="empty-icon">💰</div><div className="empty-title">No transactions found</div></div>}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
