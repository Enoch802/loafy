import { PRODUCTS, formatNaira } from '../lib/products'

export default function ProductInput({ quantities, onChange }) {
  function adjust(productId, delta) {
    const current = quantities[productId] || 0
    const next = Math.max(0, current + delta)
    onChange({ ...quantities, [productId]: next })
  }

  function handleType(productId, value) {
    const parsed = parseInt(value, 10)
    const next = isNaN(parsed) || parsed < 0 ? 0 : parsed
    onChange({ ...quantities, [productId]: next })
  }

  return (
    <div className="product-grid">
      {PRODUCTS.map(product => {
        const qty = quantities[product.id] || 0
        const hasValue = qty > 0
        return (
          <div key={product.id} className={`product-row${hasValue ? ' has-value' : ''}`}>
            <div className={`product-icon ${product.category}`}>
              {product.emoji}
            </div>
            <div className="product-details">
              <div className="product-name">{product.label}</div>
              {hasValue && (
                <div className="product-price">
                  = {formatNaira(product.price * qty)}
                </div>
              )}
            </div>
            <div className="qty-control">
              <button
                className="qty-btn"
                onClick={() => adjust(product.id, -1)}
                disabled={qty === 0}
                type="button"
                aria-label="Decrease"
              >
                −
              </button>
              <input
                type="number"
                className="qty-input"
                value={qty === 0 ? '' : qty}
                placeholder="0"
                min="0"
                onChange={e => handleType(product.id, e.target.value)}
                onFocus={e => e.target.select()}
              />
              <button
                className="qty-btn"
                onClick={() => adjust(product.id, 1)}
                type="button"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
