import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useOnline } from '../context/OnlineContext'
import { getCustomer, getTransactionsByCustomer } from '../lib/supabase'
import { getCustomerOffline } from '../lib/db'
import { formatNaira, formatDate, formatTime, formatItems } from '../lib/products'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function CustomerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isOnline = useOnline()
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const cust = isOnline ? await getCustomer(id) : await getCustomerOffline(id)
      setCustomer(cust)
      if (isOnline) {
        const txs = await getTransactionsByCustomer(id)
        setTransactions(txs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <Layout title="Customer" back="/search">
      <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
    </Layout>
  )

  if (!customer) return (
    <Layout title="Customer" back="/search">
      <div className="empty-state"><div className="empty-icon">😕</div><div className="empty-title">Customer not found</div></div>
    </Layout>
  )

  const totalPaid = transactions.reduce((s, t) => s + Number(t.amount_paid), 0)
  const totalSold = transactions.reduce((s, t) => s + Number(t.total_amount), 0)

  return (
    <Layout title={customer.name} subtitle={customer.customer_code} back="/search">
      <div className="page-content stack stack-lg" style={{ paddingTop: '1.25rem' }}>

        {/* Profile */}
        <div className="card fade-in">
          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="customer-avatar" style={{ width: 56, height: 56, fontSize: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              {getInitials(customer.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '0.25rem' }}>{customer.name}</h3>
              <span className="badge badge-neutral">{customer.customer_code}</span>
            </div>
          </div>
          {(customer.phone || customer.address) && (
            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--cream-200)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {customer.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
                  <span>📞</span><span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
                  <span>📍</span><span>{customer.address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debt Status — always prominent */}
        <div className={`debt-display ${Number(customer.total_debt) > 0 ? 'has-debt' : 'no-debt'}`} style={{ padding: '1.1rem 1.25rem' }}>
          <div>
            <div className="debt-label">
              {Number(customer.total_debt) > 0 ? '⚠️ Outstanding Debt' : '✅ No Outstanding Debt'}
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '0.2rem' }}>
              {Number(customer.total_debt) > 0 ? 'Accumulated from unpaid visits' : 'All payments up to date'}
            </div>
          </div>
          <div className="debt-amount">{formatNaira(Number(customer.total_debt) || 0)}</div>
        </div>

        {/* Stats */}
        {isOnline && transactions.length > 0 && (
          <div className="stat-grid">
            <div className="stat-card amber">
              <div className="stat-label">Total Sold</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatNaira(totalSold)}</div>
              <div className="stat-sub">{transactions.length} visits</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Total Paid</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatNaira(totalPaid)}</div>
              <div className="stat-sub">all time</div>
            </div>
          </div>
        )}

        {/* Record Sale */}
        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={() => navigate(`/customer/${id}/transaction`)}
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          🛒 Record Today's Sale
        </button>

        {/* Transaction History */}
        {isOnline && (
          <div>
            <div className="section-header">
              <span className="section-title">Transaction History</span>
              <span className="badge badge-neutral">{transactions.length}</span>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">No transactions yet</div>
              </div>
            ) : (
              <div className="tx-list fade-in">
                {transactions.map(tx => (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-header">
                      <div>
                        <div className="font-semibold text-sm">{formatDate(tx.date)}</div>
                        <div className="tx-time">{formatTime(tx.created_at)}</div>
                      </div>
                      <div className="tx-total">{formatNaira(tx.total_amount)}</div>
                    </div>
                    <div className="tx-items">{formatItems(tx.items)}</div>
                    <div className="tx-footer">
                      <span className="text-success">Paid: {formatNaira(tx.amount_paid)}</span>
                      <span className={Number(tx.debt_for_visit) > 0 ? 'text-danger' : 'text-success'}>
                        {Number(tx.debt_for_visit) > 0 ? `Debt: ${formatNaira(tx.debt_for_visit)}` : '✓ Fully paid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ paddingBottom: '1rem' }} />
      </div>
    </Layout>
  )
}
