import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAllCustomers, createCustomer, deleteCustomer } from '../../lib/supabase'
import { formatNaira } from '../../lib/products'
import { generateCustomerCode } from '../../lib/sync'
import toast from 'react-hot-toast'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function AdminCustomers() {
  const bakeryName = useAdminGuard()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => { loadCustomers() }, [])

  useEffect(() => {
    let result = [...customers]
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.customer_code.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      )
    }
    result.sort((a, b) => {
      let va = a[sortBy] ?? ''
      let vb = b[sortBy] ?? ''
      if (sortBy === 'total_debt') { va = Number(va); vb = Number(vb) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    setFiltered(result)
  }, [query, customers, sortBy, sortDir])

  async function loadCustomers() {
    setLoading(true)
    try {
      const data = await getAllCustomers()
      setCustomers(data)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function SortArrow({ col }) {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const code = generateCustomerCode(customers.length)
      const created = await createCustomer({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        customer_code: code,
        total_debt: 0,
        is_approved: true,
      })
      setCustomers(prev => [...prev, created])
      setForm({ name: '', phone: '', address: '' })
      setShowAdd(false)
      toast.success(`Customer created: ${code}`)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(e, customer) {
    e.stopPropagation()
    if (!window.confirm(`Delete ${customer.name}? This cannot be undone.`)) return
    try {
      await deleteCustomer(customer.id)
      setCustomers(prev => prev.filter(c => c.id !== customer.id))
      toast.success('Customer deleted')
    } catch (err) { toast.error(err.message) }
  }

  const totalDebt = customers.reduce((s, c) => s + Number(c.total_debt || 0), 0)
  const debtors = customers.filter(c => c.total_debt > 0).length

  return (
    <AdminLayout title="Customers" bakeryName={bakeryName}>
      <div className="stack stack-lg fade-in">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2>Customers</h2>
            <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
              {customers.length} registered · {debtors} with debt · {formatNaira(totalDebt)} total outstanding
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? '✕ Cancel' : '+ Add Customer'}
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="card card-padded fade-in" style={{ border: '1.5px solid var(--amber-pale)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--brown-700)' }}>New Customer</h4>
            <form onSubmit={handleAdd} className="stack stack-md">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer full name" autoFocus />
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
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Customer'}</button>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="search-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="search-input" placeholder="Search by name, ID or phone..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('customer_code')} style={{ cursor: 'pointer' }}>
                    Customer ID <SortArrow col="customer_code" />
                  </th>
                  <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                    Name <SortArrow col="name" />
                  </th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th onClick={() => toggleSort('total_debt')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                    Debt <SortArrow col="total_debt" />
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--brown-400)' }}>No customers found</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--cream-200)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-xs)', fontWeight: 600, color: 'var(--brown-600)' }}>
                        {c.customer_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="customer-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {getInitials(c.name)}
                        </div>
                        <span className="font-semibold" style={{ fontSize: '0.875rem' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--brown-500)', fontSize: '0.85rem' }}>{c.phone || '—'}</td>
                    <td style={{ color: 'var(--brown-500)', fontSize: '0.85rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`font-bold text-sm ${c.total_debt > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatNaira(c.total_debt || 0)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/admin/customers/${c.id}`) }}>View</button>
                        <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, c)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ fontSize: '0.75rem', color: 'var(--brown-400)', textAlign: 'right' }}>
          Showing {filtered.length} of {customers.length} customers · Click any row to view details
        </div>
      </div>
    </AdminLayout>
  )
}
