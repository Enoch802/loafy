import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../context/OnlineContext'
import { createCustomer, getAllCustomers, createNotification } from '../lib/supabase'
import { cacheCustomer } from '../lib/db'
import { generateCustomerCode } from '../lib/sync'
import toast from 'react-hot-toast'

export default function AddCustomerPage() {
  const { user } = useAuth()
  const isOnline = useOnline()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Customer name is required')

    setLoading(true)
    try {
      let customerCode

      if (isOnline) {
        const existing = await getAllCustomers()
        customerCode = generateCustomerCode(existing.length)
      } else {
        customerCode = `CUS${Date.now().toString().slice(-5)}`
      }

      const newCustomer = {
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        customer_code: customerCode,
        created_by: user?.id || null,
        total_debt: 0,
        is_approved: true,
      }

      if (isOnline) {
        const created = await createCustomer(newCustomer)
        await cacheCustomer(created)

        // Notify admin
        await createNotification({
          type: 'new_customer',
          message: `New customer added: ${name.trim()} (${customerCode}) by deliverer`,
          customer_id: created.id,
        })

        toast.success(`Customer created! ID: ${customerCode}`)
        navigate(`/customer/${created.id}`)
      } else {
        toast.error('Internet required to add new customers. Please connect and try again.')
      }
    } catch (err) {
      toast.error('Failed to add customer: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="New Customer" back="/dashboard">
      <div className="page-content stack stack-xl" style={{ paddingTop: '1.25rem' }}>
        <div className="fade-in">
          <p className="text-muted text-sm">The customer will get an instant ID and you can start recording transactions immediately. The admin will be notified.</p>
        </div>

        <form onSubmit={handleSubmit} className="stack stack-md fade-in">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              placeholder="Customer's full name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="08012345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <input
              className="form-input"
              placeholder="Street / Area / Landmark"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className="card card-padded" style={{ background: 'var(--cream-100)', border: '2px dashed var(--cream-300)' }}>
            <div className="text-sm text-muted">
              📋 The system will auto-generate a <strong>CUS#####</strong> ID for this customer upon creation.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading || !isOnline}
          >
            {loading ? 'Creating...' : '+ Create Customer'}
          </button>

          {!isOnline && (
            <p className="text-danger text-sm text-center">
              ⚠️ You must be online to add new customers
            </p>
          )}
        </form>
      </div>
    </Layout>
  )
}
