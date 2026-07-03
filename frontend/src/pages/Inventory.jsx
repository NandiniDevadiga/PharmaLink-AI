import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Inventory() {
  const { session } = useAuth();
  const token = session?.token;
  
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedMed, setSelectedMed] = useState(null);
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchGlobalMedicines(token, searchQuery);
        setSearchResults(res.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery, token]);

  function handleSelectMed(med) {
    setSelectedMed(med);
    setQty(10);
    setPrice(med.unit_price_inr || 0);
  }

  async function handleSaveStock(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePharmacyStock(token, {
        drug_name: selectedMed.drug_name,
        category: selectedMed.category,
        manufacturer: selectedMed.manufacturer,
        unit_price_inr: parseFloat(price),
        stock_qty: parseInt(qty, 10),
        otc_or_rx: selectedMed.otc_or_rx || "OTC"
      });
      setShowAddModal(false);
      setSelectedMed(null);
      setSearchQuery("");
      loadStock();
    } catch (err) {
      alert("Error adding stock: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="inventory-loading">Loading inventory...</div>;

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1>My Inventory</h1>
          <p>Manage your real-time stock levels.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Stock</button>
      </div>
      
      {error && <div className="alert-error">{error}</div>}
      
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Stock Qty</th>
              <th>Unit Price (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:"center", padding:"30px"}}>No stock added yet.</td></tr>
            ) : stock.map((item, idx) => (
              <tr key={idx}>
                <td><strong>{item.drug_name}</strong></td>
                <td><span className="badge-cat">{item.category}</span></td>
                <td><span className={item.otc_or_rx === "Rx" ? "badge-rx" : "badge-otc"}>{item.otc_or_rx}</span></td>
                <td><strong style={{color: item.stock_qty < 10 ? 'var(--color-danger)' : 'inherit'}}>{item.stock_qty}</strong></td>
                <td>₹{item.unit_price_inr.toFixed(2)}</td>
                <td>
                  <button className="btn-small" onClick={() => handleSelectMed(item) || setShowAddModal(true)}>
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{selectedMed ? "Update Stock" : "Add New Stock"}</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            
            {!selectedMed ? (
              <div className="search-section">
                <input 
                  type="text" 
                  placeholder="Search master catalog..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searching && <p className="help-text">Searching...</p>}
                <div className="search-results">
                  {searchResults.map((res, i) => (
                    <div key={i} className="search-result-item" onClick={() => handleSelectMed(res)}>
                      <strong>{res.drug_name}</strong>
                      <span>{res.category} | {res.otc_or_rx}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveStock} className="stock-form">
                <p><strong>{selectedMed.drug_name}</strong> ({selectedMed.category})</p>
                
                <label>
                  Quantity to add / update
                  <input type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} required />
                </label>
                
                <label>
                  Your Selling Price (₹)
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                </label>
                
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setSelectedMed(null)}>Back to Search</button>
                  <button type="submit" className="btn-confirm" disabled={saving}>
                    {saving ? "Saving..." : "Save Stock"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .inventory-page { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .inventory-header h1 { color: var(--color-primary); font-size: 2rem; margin: 0; }
        .inventory-header p { color: var(--color-text-muted); margin-top: 5px; }
        .btn-primary { background: var(--color-primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius-md); font-weight: bold; cursor: pointer; }
        .btn-primary:hover { background: var(--color-primary-light); }
        .table-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 10px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        th { text-align: left; padding: 12px; color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
        td { padding: 12px; border-bottom: 1px solid var(--color-border); }
        tr:last-child td { border-bottom: none; }
        .badge-cat { background: var(--color-bg); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--color-border); }
        .badge-rx { background: #FBEAE8; color: var(--color-danger); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
        .badge-otc { background: #E3F2EC; color: var(--color-success); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
        .btn-small { background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary); padding: 6px 12px; border-radius: 4px; cursor: pointer; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-card { background: white; padding: 24px; border-radius: 8px; width: 100%; max-width: 500px; }
        .modal-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted); }
        .search-section input { width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 4px; margin-bottom: 10px; font-size: 1rem; }
        .search-results { max-height: 300px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 4px; }
        .search-result-item { padding: 10px; border-bottom: 1px solid var(--color-border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .search-result-item:hover { background: var(--color-bg); }
        .search-result-item span { font-size: 0.8rem; color: var(--color-text-muted); }
        .stock-form { display: flex; flex-direction: column; gap: 16px; }
        .stock-form label { display: flex; flex-direction: column; gap: 4px; font-weight: bold; font-size: 0.85rem; }
        .stock-form input { padding: 10px; border: 1px solid var(--color-border); border-radius: 4px; font-size: 1rem; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; }
        .btn-cancel { background: transparent; border: 1px solid var(--color-border); padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .btn-confirm { background: var(--color-primary); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .alert-error { background: #FBEAE8; color: var(--color-danger); padding: 10px; border-radius: 4px; margin-bottom: 20px; }
      `}</style>
    </div>
  );
}
