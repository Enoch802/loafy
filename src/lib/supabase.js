import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

// ─── Debt Helper (recalculate from transactions, never drifts) ───────────────

async function recalculateDebt(customerId) {
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('debt_for_visit')
    .eq('customer_id', customerId)

  if (error) throw error

  const totalDebt = txs.reduce((sum, t) => sum + Number(t.debt_for_visit), 0)

  const { error: updateErr } = await supabase
    .from('customers')
    .update({ total_debt: totalDebt })
    .eq('id', customerId)

  if (updateErr) throw updateErr
  return totalDebt
}

// ─── Customers ───────────────────────────────────────────────────────────────

export async function searchCustomers(query) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`customer_code.ilike.%${query}%,name.ilike.%${query}%`)
    .order('name')
    .limit(20)
  if (error) throw error
  return data
}

export async function getCustomer(id) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCustomer(customer) {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCustomer(id, updates) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function getAllCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function createTransaction(tx) {
  // 1. Insert transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert(tx)
    .select()
    .single()
  if (error) throw error

  // 2. Recalculate customer's total debt from ALL transactions (reliable)
  try {
    await recalculateDebt(tx.customer_id)
  } catch (err) {
    console.error('Debt recalculation failed:', err)
    // Fallback: simple increment
    try {
      const { data: cust } = await supabase
        .from('customers')
        .select('total_debt')
        .eq('id', tx.customer_id)
        .single()
      if (cust !== null) {
        await supabase
          .from('customers')
          .update({ total_debt: (Number(cust.total_debt) || 0) + Number(tx.debt_for_visit) })
          .eq('id', tx.customer_id)
      }
    } catch (e) {
      console.error('Fallback debt update also failed:', e)
    }
  }

  return data
}

export async function getTransactionsByDeliverer(delivererId, date) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, customers(name, customer_code)')
    .eq('deliverer_id', delivererId)
    .eq('date', date)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTransactionsByCustomer(customerId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function getAllTransactionsByDate(date) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, customers(name, customer_code)')
    .eq('date', date)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTransactionsByDateRange(from, to) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, customers(name, customer_code)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle()
  return data
}

export async function saveSettings(settings) {
  const existing = await getSettings()
  if (existing) {
    const { data, error } = await supabase.from('settings').update(settings).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('settings').insert(settings).select().single()
    if (error) throw error
    return data
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(notification) {
  const { data, error } = await supabase.from('notifications').insert(notification).select().single()
  if (error) throw error
  return data
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, customers(name, customer_code)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function getUnreadNotificationCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  if (error) return 0
  return count || 0
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function upsertProfile(userId, fullName) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, full_name: fullName })
  if (error) throw error
}

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}
