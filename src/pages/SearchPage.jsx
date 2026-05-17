import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useOnline } from '../context/OnlineContext'
import { searchCustomers } from '../lib/supabase'
import { searchCustomersOffline } from '../lib/db'
import { formatNaira } from '../lib/products'

function debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const isOnline = useOnline()
  const navigate = useNavigate()

  const doSearch = useCallback(debounce(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    try {
      const data = isOnline ? await searchCustomers(q) : await searchCustomersOffline(q)
      setResults(data || [])
    } catch (err) {
      console.error(err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, 350), [isOnline])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    doSearch(val)
  }

  return (
    <Layout title="Find Customer">
      <div className="page-content stack stack-lg" style={{ paddingTop: '1.25rem' }}>

        <div className="search-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="search-input"
            placeholder="Type name or customer ID number..."
            value={query}
            onChange={handleChange}
            autoFocus
          />
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>}

        {!loading && searched && results.length === 0 && (
          <div className="empty-state fade-in">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No customers found</div>
            <div className="empty-desc" style={{ marginBottom: '1rem' }}>Try a different name or ID</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/add-customer')}>+ Add New Customer</button>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="stack stack-sm fade-in">
            <div className="section-title">{results.length} result{results.length !== 1 ? 's' : ''}</div>
            {results.map(customer => (
              <div
                key={customer.id}
                className="customer-card"
                onClick={() => navigate(`/customer/${customer.id}`)}
              >
                <div className="customer-avatar">{getInitials(customer.name)}</div>
                <div className="customer-info">
                  <div className="customer-name">{customer.name}</div>
                  <div className="customer-code">{customer.customer_code}</div>
                  {customer.address && <div className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>{customer.address}</div>}
                </div>
                <div className="customer-debt">
                  <div className="text-xs text-muted" style={{ marginBottom: '0.15rem' }}>Debt</div>
                  <div className={`font-bold ${customer.total_debt > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '0.9rem' }}>
                    {formatNaira(customer.total_debt || 0)}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cream-400)" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <div className="empty-title">Search for a customer</div>
            <div className="empty-desc">Type a name or the number part of a Customer ID<br/>e.g. "10001" or "Mary"</div>
          </div>
        )}

        <div style={{ paddingBottom: '1rem' }} />
      </div>
    </Layout>
  )
}
