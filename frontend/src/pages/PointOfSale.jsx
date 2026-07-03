import { useState, useEffect, useMemo } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function PointOfSale() {
  const { session } = useAuth();
  const token = session?.token;
  
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);

  async function loadStock() {
    try {
      setLoading(true);
      const res = await api.getPharmacyStock(token);
      setStock(res.stock || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadStock();
  }, [token]);

  const filteredStock = useMemo(() => {
    if (!searchQuery) return stock.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return stock.filter(item => item.drug_name.toLowerCase().includes(q)).slice(0, 15);
  }, [stock, searchQuery]);

  function addToCart(item) {
    if (item.stock_qty <= 0) return alert("Out of stock!");
    
    const existing = cart.find(c => c.drug_name === item.drug_name);
    if (existing) {
      if (existing.quantity >= item.stock_qty) return alert("Not enough stock!");
      setCart(cart.map(c => c.drug_name === item.drug_name ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  }

  function removeFromCart(drugName) {
    setCart(cart.filter(c => c.drug_name !== drugName));
  }

  function updateCartQty(drugName, qtyStr, maxStock) {
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty < 1) return;
    if (qty > maxStock) return alert("Cannot exceed current stock!");
    
    setCart(cart.map(c => c.drug_name === drugName ? { ...c, quantity: qty } : c));
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.unit_price_inr * item.quantity), 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setLastSaleId(null);
    setError(null);
    try {
      const items = cart.map(c => ({
        drug_name: c.drug_name,
        quantity: c.quantity,
        unit_price_inr: c.unit_price_inr,
        category: c.category,
        otc_or_rx: c.otc_or_rx
      }));
      
      const res = await api.recordSale(token, items);
      setLastSaleId(res.transaction_id);
      setCart([]);
      loadStock(); // Reload stock to reflect deducted quantities
    } catch (err) {
      setError("Failed to process sale: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="pos-loading">Loading POS terminal...</div>;

  return (
    <div className="pos-page">
      <div className="pos-header">
        <h1>Point of Sale</h1>
        <p>Record real-time sales and deduct from inventory.</p>
      </div>
      
      {error && <div className="alert-error">{error}</div>}
      {lastSaleId && <div className="alert-success">Sale successful! TX ID: <strong>{lastSaleId}</strong></div>}
      
      <div className="pos-layout">
        {/* Left Side: Stock Search */}
        <div className="pos-stock-panel">
          <input 
            type="text" 
            placeholder="Search your inventory (e.g. Paracetamol)..." 
            className="pos-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="stock-grid">
            {filteredStock.map((item, idx) => (
              <div 
                key={idx} 
                className={`stock-card ${item.stock_qty <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(item)}
              >
                <h4>{item.drug_name}</h4>
                <div className="stock-card-meta">
                  <span className={item.otc_or_rx === "Rx" ? "badge-rx" : "badge-otc"}>{item.otc_or_rx}</span>
                  <span>₹{item.unit_price_inr.toFixed(2)}</span>
                </div>
                <div className="stock-card-qty">
                  Stock: <strong style={{color: item.stock_qty <= 5 ? 'var(--color-danger)' : 'inherit'}}>{item.stock_qty}</strong>
                </div>
              </div>
            ))}
            {filteredStock.length === 0 && <p style={{gridColumn:"1/-1", textAlign:"center", padding:"20px", color:"var(--color-text-muted)"}}>No matching items in inventory.</p>}
          </div>
        </div>

        {/* Right Side: Cart */}
        <div className="pos-cart-panel">
          <h3>Current Sale</h3>
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Cart is empty. Click items on the left to add them.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="cart-item">
                  <div className="cart-item-info">
                    <strong>{item.drug_name}</strong>
                    <span>₹{item.unit_price_inr.toFixed(2)} / ea</span>
                  </div>
                  <div className="cart-item-actions">
                    <input 
                      type="number" 
                      min="1" 
                      max={item.stock_qty} 
                      value={item.quantity}
                      onChange={(e) => updateCartQty(item.drug_name, e.target.value, item.stock_qty)}
                    />
                    <strong>₹{(item.unit_price_inr * item.quantity).toFixed(2)}</strong>
                    <button className="btn-remove" onClick={() => removeFromCart(item.drug_name)}>&times;</button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="cart-summary">
            <div className="cart-total-row">
              <span>Total:</span>
              <strong>₹{cartTotal.toFixed(2)}</strong>
            </div>
            <button 
              className="btn-checkout" 
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
            >
              {submitting ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .pos-page { max-width: 1400px; margin: 0 auto; padding: 30px 20px; height: calc(100vh - 70px); display: flex; flex-direction: column; }
        .pos-header h1 { color: var(--color-primary); font-size: 2rem; margin: 0; }
        .pos-header p { color: var(--color-text-muted); margin-top: 5px; margin-bottom: 20px; }
        .alert-error { background: #FBEAE8; color: var(--color-danger); padding: 12px; border-radius: 4px; margin-bottom: 16px; border: 1px solid #F5C6C1; }
        .alert-success { background: #EDF6F1; color: var(--color-success); padding: 12px; border-radius: 4px; margin-bottom: 16px; border: 1px solid #CFE6DA; }
        
        .pos-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; flex: 1; min-height: 0; }
        
        /* Stock Panel */
        .pos-stock-panel { display: flex; flex-direction: column; gap: 16px; min-height: 0; }
        .pos-search { padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: 1.05rem; font-family: var(--font-body); }
        .stock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; overflow-y: auto; padding-right: 8px; align-content: start; }
        .stock-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; cursor: pointer; transition: transform 0.1s, border-color 0.1s; display: flex; flex-direction: column; gap: 8px; }
        .stock-card:hover { border-color: var(--color-primary); transform: translateY(-2px); }
        .stock-card.out-of-stock { opacity: 0.5; pointer-events: none; }
        .stock-card h4 { margin: 0; font-size: 0.95rem; line-height: 1.3; }
        .stock-card-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
        .stock-card-qty { font-size: 0.8rem; color: var(--color-text-muted); padding-top: 8px; border-top: 1px dashed var(--color-border); }
        .badge-rx { background: #FBEAE8; color: var(--color-danger); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; }
        .badge-otc { background: #E3F2EC; color: var(--color-success); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; }

        /* Cart Panel */
        .pos-cart-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); display: flex; flex-direction: column; overflow: hidden; }
        .pos-cart-panel h3 { margin: 0; padding: 20px; border-bottom: 1px solid var(--color-border); font-size: 1.2rem; background: var(--color-bg); }
        .cart-items { flex: 1; overflow-y: auto; padding: 0; margin: 0; }
        .empty-cart { padding: 40px 20px; text-align: center; color: var(--color-text-muted); font-size: 0.95rem; }
        .cart-item { padding: 16px 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
        .cart-item-info { display: flex; flex-direction: column; gap: 4px; }
        .cart-item-info strong { font-size: 0.95rem; }
        .cart-item-info span { font-size: 0.8rem; color: var(--color-text-muted); }
        .cart-item-actions { display: flex; align-items: center; gap: 12px; }
        .cart-item-actions input { width: 50px; padding: 6px; border: 1px solid var(--color-border); border-radius: 4px; text-align: center; }
        .cart-item-actions strong { min-width: 70px; text-align: right; }
        .btn-remove { background: #FBEAE8; color: var(--color-danger); border: none; width: 28px; height: 28px; border-radius: 14px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .cart-summary { padding: 20px; border-top: 1px solid var(--color-border); background: var(--color-bg); }
        .cart-total-row { display: flex; justify-content: space-between; align-items: center; font-size: 1.4rem; margin-bottom: 20px; }
        .btn-checkout { width: 100%; background: var(--color-primary); color: white; border: none; padding: 16px; border-radius: var(--radius-md); font-size: 1.1rem; font-weight: bold; cursor: pointer; }
        .btn-checkout:hover { background: var(--color-primary-light); }
        .btn-checkout:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
