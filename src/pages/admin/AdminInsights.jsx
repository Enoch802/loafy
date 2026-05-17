import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getAllCustomers, getTransactionsByDateRange } from '../../lib/supabase'
import { formatNaira, today } from '../../lib/products'

function useAdminGuard() {
  const navigate = useNavigate()
  useEffect(() => { if (sessionStorage.getItem('admin_auth') !== 'true') navigate('/admin') }, [])
  return sessionStorage.getItem('bakery_name') || 'Bakery'
}

async function callGroq(prompt) {
  const res = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'AI request failed')
  return data.content
}

export default function AdminInsights() {
  const bakeryName = useAdminGuard()
  const [loading, setLoading] = useState(false)
  const [activeInsight, setActiveInsight] = useState(null)
  const [result, setResult] = useState('')
  const [top20, setTop20] = useState([])
  const [top20Loading, setTop20Loading] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const from = new Date(); from.setDate(from.getDate() - 90)
      const [custs, txs] = await Promise.all([
        getAllCustomers(),
        getTransactionsByDateRange(from.toISOString().split('T')[0], today()),
      ])
      setCustomers(custs)
      setTransactions(txs)
      setDataReady(true)
    } catch (err) { console.error('Data load error:', err) }
  }

  async function runInsight(type) {
    if (!dataReady) return
    setLoading(true)
    setActiveInsight(type)
    setResult('')

    try {
      let prompt = ''

      if (type === 'debt') {
        const debtors = customers
          .filter(c => c.total_debt > 0)
          .sort((a, b) => b.total_debt - a.total_debt)
          .slice(0, 25)
          .map(c => `${c.name} (${c.customer_code}): ₦${c.total_debt} outstanding`)

        if (debtors.length === 0) {
          setResult('🎉 Great news — no customers currently have outstanding debt!')
          setLoading(false)
          return
        }

        prompt = `You are a business analyst for "${bakeryName}", a Nigerian bread and doughnut delivery bakery.

Analyze these customers with outstanding debts and provide:
• Which customers are highest risk (large debt)
• Any patterns you notice
• 3-5 specific actionable debt collection strategies

Debtors list:
${debtors.join('\n')}

Total customers with debt: ${debtors.length}`
      }

      if (type === 'behaviour') {
        const summary = customers.slice(0, 50).map(c => {
          const cTxs = transactions.filter(t => t.customer_id === c.id)
          const totalSpend = cTxs.reduce((s, t) => s + Number(t.total_amount), 0)
          const days = [...new Set(cTxs.map(t => t.date))].length
          const avgPerVisit = cTxs.length > 0 ? Math.round(totalSpend / cTxs.length) : 0
          return `${c.name}: ${days} days purchased, ₦${totalSpend} total, avg ₦${avgPerVisit}/visit, debt: ₦${c.total_debt}`
        }).join('\n')

        prompt = `You are a business analyst for "${bakeryName}", a Nigerian bread and doughnut delivery bakery.

Analyze this customer buying behavior data from the last 90 days and provide:
• Who are the most valuable customers
• Who might be at risk of stopping purchases
• Key trends or patterns
• 3-4 actionable recommendations to grow the business

Customer data:
${summary}`
      }

      const content = await callGroq(prompt)
      setResult(content)
    } catch (err) {
      setResult(`⚠️ AI analysis failed: ${err.message}\n\nPlease check that GROQ_API_KEY is set in your Vercel environment variables.`)
    } finally {
      setLoading(false)
    }
  }

  async function loadTop20() {
    if (!dataReady) return
    setTop20Loading(true)
    try {
      const scored = customers.map(c => {
        const cTxs = transactions.filter(t => t.customer_id === c.id)
        const totalSpend = cTxs.reduce((s, t) => s + Number(t.total_amount), 0)
        const totalCollected = cTxs.reduce((s, t) => s + Number(t.amount_paid), 0)
        const visitDays = [...new Set(cTxs.map(t => t.date))].length
        const debtRatio = totalSpend > 0 ? (Number(c.total_debt) / totalSpend) : 0
        // Score = spend × (1 - debt ratio) — rewards high spend AND clean payment
        const score = totalSpend * (1 - Math.min(debtRatio, 1))
        return { ...c, totalSpend, totalCollected, visitDays, score }
      })
      setTop20(scored.sort((a, b) => b.score - a.score).slice(0, 20))
    } catch (err) { console.error(err) }
    finally { setTop20Loading(false) }
  }

  const rankClass = i => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''

  return (
    <AdminLayout title="AI Insights" bakeryName={bakeryName}>
      <div className="stack stack-xl fade-in">

        <div>
          <h2>AI Insights 🤖</h2>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
            Powered by Groq · Analysing last 90 days · {customers.length} customers · {transactions.length} transactions
          </p>
        </div>

        {!dataReady && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>}

        {dataReady && (
          <>
            {/* Insight Triggers */}
            <div className="stack stack-sm">
              {[
                { type: 'debt', emoji: '⚠️', title: 'Debt Pattern Alerts', desc: 'Identify high-risk debtors and get collection strategies', border: 'var(--danger-mid)' },
                { type: 'behaviour', emoji: '📈', title: 'Buying Behaviour Analysis', desc: 'Understand purchase patterns, loyal customers, and growth opportunities', border: 'var(--info)' },
              ].map(item => (
                <div key={item.type} className="card card-padded" style={{ borderLeft: `4px solid ${item.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                        <span className="font-semibold" style={{ fontSize: '0.9rem', color: 'var(--brown-800)' }}>{item.title}</span>
                      </div>
                      <p className="text-sm text-muted">{item.desc}</p>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => runInsight(item.type)}
                      disabled={loading}
                      style={{ flexShrink: 0 }}
                    >
                      {loading && activeInsight === item.type ? '...' : 'Analyse'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Result */}
            {result && (
              <div className="insight-card fade-in">
                <div className="insight-header">
                  <span className="insight-icon">{activeInsight === 'debt' ? '⚠️' : '📈'}</span>
                  <span className="insight-title">{activeInsight === 'debt' ? 'Debt Analysis' : 'Buying Behaviour'}</span>
                </div>
                <div className="insight-body" style={{ whiteSpace: 'pre-wrap' }}>{result}</div>
              </div>
            )}

            {/* Top 20 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                <div>
                  <div className="section-title">Top 20 Consistent Customers</div>
                  <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                    Ranked by: highest spend × debt-free record (updates on each load)
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={loadTop20} disabled={top20Loading} style={{ flexShrink: 0 }}>
                  {top20Loading ? '...' : top20.length > 0 ? '↻ Refresh' : 'Generate'}
                </button>
              </div>

              {top20.length > 0 && (
                <div className="data-table-wrap fade-in">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>ID</th>
                        <th>Days Purchased</th>
                        <th style={{ textAlign: 'right' }}>Total Spend</th>
                        <th style={{ textAlign: 'right' }}>Debt Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top20.map((c, i) => (
                        <tr key={c.id}>
                          <td><div className={`rank-num ${rankClass(i)}`}>{i + 1}</div></td>
                          <td><span className="font-semibold" style={{ fontSize: '0.875rem' }}>{c.name}</span></td>
                          <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--brown-500)' }}>{c.customer_code}</span></td>
                          <td><span style={{ fontSize: '0.875rem' }}>{c.visitDays}</span></td>
                          <td style={{ textAlign: 'right' }}><span className="font-bold text-amber">{formatNaira(c.totalSpend)}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`font-semibold text-sm ${c.total_debt > 0 ? 'text-danger' : 'text-success'}`}>
                              {c.total_debt > 0 ? `₦${Number(c.total_debt).toLocaleString()}` : '✓ Clean'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
