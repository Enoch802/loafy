import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getCustomer, getTransactionsByCustomer, updateCustomer } from '../../lib/supabase'
import { formatNaira, formatDate, formatTime, formatItems } from '../../lib/products'
import toast from 'react-hot-toast'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function AdminCustomerDetail() {
  const bakeryName = useAdminGuard()
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const [cust, txs] = await Promise.all([
        getCustomer(id),
        getTransactionsByCustomer(id)
      ])
      setCustomer(cust)
      setForm({ name: cust.name, phone: cust.phone || '', address: cust.address || '' })
      setTransactions(txs)
    } catch { toast.error('Failed to load customer') }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const updated = await updateCustomer(id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      })
      setCustomer(updated)
      setEditing(false)
      toast.success('Customer updated')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <AdminLayout title="Customer" bakeryName={bakeryName}>
      <div style={{ textAlign: 'center', padding: '4rem' }}><div className="spinner" /></div>
    </AdminLayout>
  )

  if (!customer) return (
    <AdminLayout title="Customer" bakeryName={bakeryName}>
      <div className="empty-state"><div className="empty-icon">😕</div><div className="empty-title">Customer not found</div></div>
    </AdminLayout>
  )

  const totalSold = transactions.reduce((s, t) => s + Number(t.total_amount), 0)
  const totalCollected = transactions.reduce((s, t) => s + Number(t.amount_paid), 0)

  return (
    <AdminLayout title={customer.name} bakeryName={bakeryName}>
      <div className="stack stack-lg fade-in">

        {/* Back + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/customers')}>← Back</button>
          <h2 style={{ flex: 1 }}>{customer.name}</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(v => !v) }}>
            {editing ? '✕ Cancel' : '✏️ Edit'}
          </button>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="card card-padded fade-in" style={{ border: '1.5px solid var(--amber-pale)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Edit Customer Details</h4>
            <div className="stack stack-md">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08012345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street / Area" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Profile */}
          <div className="card card-padded" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="customer-avatar" style={{ width: 52, height: 52, fontSize: '1.2rem', borderRadius: 'var(--radius-md)' }}>
                {getInitials(customer.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{customer.name}</h3>
                <span className="badge badge-neutral">{customer.customer_code}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><span className="text-muted">Phone: </span>{customer.phone || '—'}</div>
              <div><span className="text-muted">Address: </span>{customer.address || '—'}</div>
              <div><span className="text-muted">Member since: </span>{formatDate(customer.created_at)}</div>
              <div><span className="text-muted">Visits: </span>{transactions.length}</div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="stat-grid">
          <div className="stat-card amber">
            <div className="stat-label">Total Sold</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatNaira(totalSold)}</div>
            <div className="stat-sub">all time</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Total Paid</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatNaira(totalCollected)}</div>
            <div className="stat-sub">all time</div>
          </div>
          <div className={`stat-card ${Number(customer.total_debt) > 0 ? 'danger' : 'success'}`} style={{ gridColumn: 'span 2' }}>
            <div className="stat-label">Outstanding Debt</div>
            <div className="stat-value">{formatNaira(Number(customer.total_debt) || 0)}</div>
            <div className="stat-sub">{Number(customer.total_debt) > 0 ? 'Accumulated unpaid balance' : 'All payments up to date'}</div>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>
            Transaction History ({transactions.length})
          </div>
          <div className="tx-list">
            {transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">No transactions yet</div>
              </div>
            ) : transactions.map(tx => (
              <div key={tx.id} className="tx-item">
                <div className="tx-header">
                  <div>
                    <div className="font-semibold text-sm">{formatDate(tx.date)}</div>
                    <div className="tx-time">{formatTime(tx.created_at)} · {tx.deliverer_name || 'Deliverer'}</div>
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
        </div>
      </div>
    </AdminLayout>
  )
}
