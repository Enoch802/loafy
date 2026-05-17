import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProductInput from '../components/ProductInput'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../context/OnlineContext'
import { getCustomer, createTransaction } from '../lib/supabase'
import { getCustomerOffline, savePendingTransaction, updateCustomerDebtOffline } from '../lib/db'
import { calcTotal, formatNaira, today } from '../lib/products'
import toast from 'react-hot-toast'

export default function NewTransactionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const isOnline = useOnline()

  const [customer, setCustomer] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [amountPaid, setAmountPaid] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCustomer() }, [id])

  async function loadCustomer() {
    try {
      const cust = isOnline ? await getCustomer(id) : await getCustomerOffline(id)
      setCustomer(cust)
    } catch { toast.error('Failed to load customer') }
    finally { setLoading(false) }
  }

  const totalAmount = calcTotal(quantities)
  const paid = parseFloat(amountPaid) || 0
  const debtForVisit = Math.max(0, totalAmount - paid)
  const change = Math.max(0, paid - totalAmount)
  const hasItems = totalAmount > 0

  async function handleSubmit() {
    if (!hasItems) return toast.error('Please add at least one item')
    if (amountPaid === '') return toast.error('Please enter the amount paid (enter 0 if nothing was paid)')
    if (paid < 0) return toast.error('Amount paid cannot be negative')
    setSaving(true)
    try {
      const tx = {
        customer_id: id,
        deliverer_id: user.id,
        deliverer_name: profile?.full_name || 'Deliverer',
        date: today(),
        items: quantities,
        total_amount: totalAmount,
        amount_paid: paid,
        debt_for_visit: debtForVisit,
      }
      if (isOnline) {
        await createTransaction(tx)
      } else {
        await savePendingTransaction(tx)
        await updateCustomerDebtOffline(id, debtForVisit)
        toast('Saved offline — will sync when online', { icon: '📶', duration: 4000 })
      }
      toast.success('Transaction recorded!')
      navigate(`/customer/${id}`)
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title="Record Sale" back={`/customer/${id}`}>
      <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
    </Layout>
  )

  return (
    <Layout title={customer?.name || 'Record Sale'} subtitle="New Transaction" back={`/customer/${id}`}>
      <div className="page-content stack stack-lg" style={{ paddingTop: '1.25rem' }}>

        {/* Previous Debt */}
        {Number(customer?.total_debt) > 0 && (
          <div className="debt-display has-debt fade-in">
            <div>
              <div className="debt-label">Previous Debt</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '0.15rem' }}>Carried over from before today</div>
            </div>
            <div className="debt-amount">{formatNaira(customer.total_debt)}</div>
          </div>
        )}

        {/* Products */}
        <div>
          <div className="section-header">
            <span className="section-title">Items Purchased</span>
            {hasItems && <span className="badge badge-amber">{formatNaira(totalAmount)}</span>}
          </div>
          <ProductInput quantities={quantities} onChange={setQuantities} />
        </div>

        {/* Total */}
        {hasItems && (
          <div className="total-bar fade-in">
            <div className="total-bar-row">
              <span className="total-bar-label">TODAY'S TOTAL</span>
              <span className="total-bar-value">{formatNaira(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Payment */}
        <div>
          <div className="section-header">
            <span className="section-title">Amount Paid</span>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--brown-400)', fontSize: '1.1rem', pointerEvents: 'none' }}>₦</span>
            <input
              type="number"
              className="form-input form-input-lg"
              style={{ paddingLeft: '2.1rem' }}
              placeholder="0"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              min="0"
            />
          </div>
          <p className="text-xs text-muted" style={{ marginTop: '0.4rem' }}>Enter 0 if the customer paid nothing today</p>
        </div>

        {/* Breakdown */}
        {hasItems && amountPaid !== '' && (
          <div className="card card-padded fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span className="text-muted">Goods Total</span>
                <span className="font-semibold">{formatNaira(totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span className="text-muted">Amount Paid</span>
                <span className="font-semibold text-success">{formatNaira(paid)}</span>
              </div>
              {change > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="text-muted">Change to give back</span>
                  <span className="font-semibold text-amber">{formatNaira(change)}</span>
                </div>
              )}
              <div className="divider" style={{ margin: '0.25rem 0' }} />
              <div className={`debt-display ${debtForVisit > 0 ? 'has-debt' : 'no-debt'}`} style={{ padding: '0.75rem 1rem' }}>
                <div className="debt-label">
                  {debtForVisit > 0 ? '⚠️ Debt from this visit' : '✅ Fully paid'}
                </div>
                <div className="debt-amount">{formatNaira(debtForVisit)}</div>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={handleSubmit}
          disabled={saving || !hasItems}
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          {saving ? 'Saving...' : '✓ Confirm Transaction'}
        </button>

        <div style={{ paddingBottom: '1rem' }} />
      </div>
    </Layout>
  )
}
