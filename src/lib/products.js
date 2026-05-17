export const PRODUCTS = [
  { id: 'bread_250',   label: '₦250 Bread',   price: 250,  category: 'bread',    emoji: '🍞' },
  { id: 'bread_350',   label: '₦350 Bread',   price: 350,  category: 'bread',    emoji: '🍞' },
  { id: 'bread_450',   label: '₦450 Bread',   price: 450,  category: 'bread',    emoji: '🍞' },
  { id: 'bread_650',   label: '₦650 Bread',   price: 650,  category: 'bread',    emoji: '🍞' },
  { id: 'bread_900',   label: '₦900 Bread',   price: 900,  category: 'bread',    emoji: '🍞' },
  { id: 'bread_1400',  label: '₦1,400 Bread', price: 1400, category: 'bread',    emoji: '🍞' },
  { id: 'doughnut_1100', label: 'Doughnut',   price: 1100, category: 'doughnut', emoji: '🍩' },
]

export function calcTotal(quantities) {
  return PRODUCTS.reduce((sum, p) => sum + p.price * (quantities[p.id] || 0), 0)
}

export function formatNaira(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0 })
}

export function formatItems(quantities) {
  return PRODUCTS
    .filter(p => (quantities[p.id] || 0) > 0)
    .map(p => `${quantities[p.id]}x ${p.label}`)
    .join(', ')
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}
