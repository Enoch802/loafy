import { getPendingTransactions, markTransactionSynced, cacheCustomers } from './db'
import { createTransaction, getAllCustomers } from './supabase'
import toast from 'react-hot-toast'

let isSyncing = false

export async function syncPendingTransactions() {
  if (isSyncing || !navigator.onLine) return
  isSyncing = true

  try {
    const pending = await getPendingTransactions()
    if (pending.length === 0) return

    let synced = 0
    let failed = 0

    for (const tx of pending) {
      try {
        const { local_id, synced: _, ...txData } = tx
        await createTransaction(txData)
        await markTransactionSynced(local_id)
        synced++
      } catch (err) {
        console.error('Failed to sync transaction:', err)
        failed++
      }
    }

    if (synced > 0) {
      toast.success(`Synced ${synced} offline transaction${synced > 1 ? 's' : ''}`, {
        icon: '☁️',
        duration: 3000,
      })
    }
    if (failed > 0) {
      toast.error(`${failed} transaction${failed > 1 ? 's' : ''} failed to sync`)
    }
  } finally {
    isSyncing = false
  }
}

export async function refreshCustomerCache() {
  if (!navigator.onLine) return
  try {
    const customers = await getAllCustomers()
    await cacheCustomers(customers)
  } catch {
    // Silent fail — cache remains from last sync
  }
}

export function setupSyncListeners() {
  window.addEventListener('online', async () => {
    await syncPendingTransactions()
    await refreshCustomerCache()
  })
}

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'loafy_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password, hash) {
  const computed = await hashPassword(password)
  return computed === hash
}

export function generateCustomerCode(count) {
  const num = String(count + 10000).padStart(5, '0')
  return `CUS${num}`
}
