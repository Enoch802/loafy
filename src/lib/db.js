import { openDB } from 'idb'

const DB_NAME = 'loafy-offline'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending transactions to sync
        if (!db.objectStoreNames.contains('pending_transactions')) {
          const txStore = db.createObjectStore('pending_transactions', { keyPath: 'local_id' })
          txStore.createIndex('by_date', 'date')
          txStore.createIndex('by_customer', 'customer_id')
        }

        // Customer cache for offline search
        if (!db.objectStoreNames.contains('customers_cache')) {
          const custStore = db.createObjectStore('customers_cache', { keyPath: 'id' })
          custStore.createIndex('by_code', 'customer_code')
          custStore.createIndex('by_name', 'name')
        }

        // Settings cache
        if (!db.objectStoreNames.contains('settings_cache')) {
          db.createObjectStore('settings_cache', { keyPath: 'key' })
        }

        // Daily summaries cache
        if (!db.objectStoreNames.contains('daily_cache')) {
          db.createObjectStore('daily_cache', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// ─── Pending Transactions ─────────────────────────────────────────────────────

export async function savePendingTransaction(tx) {
  const db = await getDB()
  const localId = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  await db.put('pending_transactions', { ...tx, local_id: localId, synced: false })
  return localId
}

export async function getPendingTransactions() {
  const db = await getDB()
  const all = await db.getAll('pending_transactions')
  return all.filter(t => !t.synced)
}

export async function markTransactionSynced(localId) {
  const db = await getDB()
  await db.delete('pending_transactions', localId)
}

export async function getAllLocalTransactionsByDate(date, delivererId) {
  const db = await getDB()
  const all = await db.getAll('pending_transactions')
  return all.filter(t => t.date === date && t.deliverer_id === delivererId)
}

// ─── Customer Cache ───────────────────────────────────────────────────────────

export async function cacheCustomers(customers) {
  const db = await getDB()
  const tx = db.transaction('customers_cache', 'readwrite')
  await Promise.all([
    ...customers.map(c => tx.store.put(c)),
    tx.done,
  ])
}

export async function cacheCustomer(customer) {
  const db = await getDB()
  await db.put('customers_cache', customer)
}

export async function searchCustomersOffline(query) {
  const db = await getDB()
  const all = await db.getAll('customers_cache')
  const q = query.toLowerCase()
  return all.filter(
    c =>
      c.customer_code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q)
  )
}

export async function getCustomerOffline(id) {
  const db = await getDB()
  return db.get('customers_cache', id)
}

export async function updateCustomerDebtOffline(customerId, debtDelta) {
  const db = await getDB()
  const customer = await db.get('customers_cache', customerId)
  if (customer) {
    customer.total_debt = (customer.total_debt || 0) + debtDelta
    await db.put('customers_cache', customer)
  }
}

// ─── Settings Cache ───────────────────────────────────────────────────────────

export async function cacheSettings(settings) {
  const db = await getDB()
  await db.put('settings_cache', { key: 'settings', ...settings })
}

export async function getCachedSettings() {
  const db = await getDB()
  return db.get('settings_cache', 'settings')
}

// ─── Daily Cache ──────────────────────────────────────────────────────────────

export async function cacheDailySummary(date, data) {
  const db = await getDB()
  await db.put('daily_cache', { key: `daily_${date}`, date, data, cached_at: Date.now() })
}

export async function getCachedDailySummary(date) {
  const db = await getDB()
  const entry = await db.get('daily_cache', `daily_${date}`)
  if (!entry) return null
  // Return if cached within last 5 minutes
  if (Date.now() - entry.cached_at < 5 * 60 * 1000) return entry.data
  return null
}
