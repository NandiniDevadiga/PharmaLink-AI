import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:8000";

const CATEGORIES = [
  "All",
  "Analgesic",
  "Antibiotic",
  "Antihistamine",
  "Antidiabetic",
  "Cardiovascular",
  "Gastrointestinal",
  "Neurological",
  "Hormonal",
  "Respiratory",
  "Supplement",
  "Dermatological",
  "Other",
];

const CATEGORY_COLORS = {
  Analgesic: "#e74c3c",
  Antibiotic: "#8e44ad",
  Antihistamine: "#2980b9",
  Antidiabetic: "#16a085",
  Cardiovascular: "#c0392b",
  Gastrointestinal: "#d35400",
  Neurological: "#6c5ce7",
  Hormonal: "#e91e8c",
  Respiratory: "#0984e3",
  Supplement: "#00b894",
  Dermatological: "#fdcb6e",
  Other: "#636e72",
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{type === "success" ? "✓" : type === "error" ? "✕" : "⚠"}</span>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

function EditModal({ medicine, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: medicine.name || "",
    manufacturer_name: medicine.manufacturer_name || "",
    price: medicine.price ?? "",
    pack_size_label: medicine.pack_size_label || "",
    short_composition1: medicine.short_composition1 || "",
    short_composition2: medicine.short_composition2 || "",
    type: medicine.type || "",
    Is_discontinued: medicine.Is_discontinued ?? false,
    category: medicine.category || "",
    otc_or_rx: medicine.otc_or_rx || "OTC",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`${API}/admin/medicines/${medicine._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: form.price !== "" ? parseFloat(form.price) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Save failed");
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>Edit Medicine</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              <span>Medicine Name *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Manufacturer</span>
              <input value={form.manufacturer_name} onChange={(e) => setForm({ ...form, manufacturer_name: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Price (₹)</span>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Pack Size</span>
              <input value={form.pack_size_label} onChange={(e) => setForm({ ...form, pack_size_label: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Composition 1</span>
              <input value={form.short_composition1} onChange={(e) => setForm({ ...form, short_composition1: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Composition 2</span>
              <input value={form.short_composition2} onChange={(e) => setForm({ ...form, short_composition2: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Type</span>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>OTC / Rx</span>
              <select value={form.otc_or_rx} onChange={(e) => setForm({ ...form, otc_or_rx: e.target.value })}>
                <option value="OTC">OTC</option>
                <option value="Rx">Rx</option>
              </select>
            </label>
            <label className="form-field form-field-check">
              <input type="checkbox" checked={form.Is_discontinued} onChange={(e) => setForm({ ...form, Is_discontinued: e.target.checked })} />
              <span>Discontinued</span>
            </label>
          </div>
          {err && <div className="form-error">⚠ {err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-box modal-sm">
        <div className="modal-header">
          <h3>{danger ? "⚠ Confirm Delete" : "Confirm Action"}</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--color-text)", lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MedicineCatalog() {
  const { session } = useAuth();
  const token = session?.token;

  // Upload state
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileRef = useRef();

  // Table state
  const [medicines, setMedicines] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [otcRx, setOtcRx] = useState("All");
  const [discontinued, setDiscontinued] = useState("All");
  const [loading, setLoading] = useState(false);

  // Selection
  const [selected, setSelected] = useState(new Set());

  // Modals
  const [editMed, setEditMed] = useState(null);
  const [deleteMed, setDeleteMed] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedSearch, category, otcRx, discontinued]);

  const fetchMedicines = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: pageSize });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (category !== "All") params.set("category", category);
      if (otcRx !== "All") params.set("otc_or_rx", otcRx);
      if (discontinued === "discontinued") params.set("discontinued", "true");
      if (discontinued === "active") params.set("discontinued", "false");

      const res = await fetch(`${API}/admin/medicines?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load medicines");
      const data = await res.json();
      setMedicines(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, debouncedSearch, category, otcRx, discontinued]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      showToast("Please upload a .csv file", "error");
      return;
    }
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/admin/medicines/upload-csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setUploadResult(data);
      showToast(`✓ Uploaded ${data.total_rows?.toLocaleString()} medicines successfully!`);
      fetchMedicines();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const doDelete = async (id) => {
    try {
      const res = await fetch(`${API}/admin/medicines/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast("Medicine deleted.");
      fetchMedicines();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeleteMed(null);
    }
  };

  const doBulkDelete = async () => {
    try {
      const res = await fetch(`${API}/admin/medicines/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      showToast(data.message);
      setSelected(new Set());
      fetchMedicines();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBulkDeleteConfirm(false);
    }
  };

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === medicines.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(medicines.map((m) => m._id)));
    }
  };

  const allSelected = medicines.length > 0 && selected.size === medicines.length;
  const someSelected = selected.size > 0;

  return (
    <div className="catalog-page">
      {/* ── TOAST ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── MODALS ── */}
      {editMed && (
        <EditModal
          medicine={editMed}
          token={token}
          onClose={() => setEditMed(null)}
          onSaved={() => {
            setEditMed(null);
            showToast("Medicine updated successfully.");
            fetchMedicines();
          }}
        />
      )}
      {deleteMed && (
        <ConfirmModal
          message={`Are you sure you want to delete "${deleteMed.name}"? This action cannot be undone.`}
          onConfirm={() => doDelete(deleteMed._id)}
          onCancel={() => setDeleteMed(null)}
        />
      )}
      {bulkDeleteConfirm && (
        <ConfirmModal
          message={`Delete ${selected.size} selected medicine${selected.size > 1 ? "s" : ""}? This cannot be undone.`}
          onConfirm={doBulkDelete}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      )}

      {/* ── HEADER ── */}
      <div className="catalog-header">
        <div>
          <h1 className="catalog-title">
            <span className="catalog-title-icon">💊</span> Medicine Catalog
          </h1>
          <p className="catalog-subtitle">
            Upload the Kaggle A-Z dataset and manage all medicines
          </p>
        </div>
        <div className="catalog-header-stats">
          <div className="stat-pill">
            <span className="stat-num">{total.toLocaleString()}</span>
            <span className="stat-lbl">Total Medicines</span>
          </div>
        </div>
      </div>

      {/* ── UPLOAD ZONE ── */}
      <div className="upload-section">
        <div
          className={`drop-zone ${dragging ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="upload-state">
              <div className="upload-spinner" />
              <span>Processing CSV… This may take a moment for large files</span>
            </div>
          ) : (
            <div className="upload-state">
              <div className="upload-icon">📂</div>
              <div className="upload-text">
                <strong>Drop the Kaggle CSV here</strong> or click to browse
              </div>
              <div className="upload-hint">
                Supports: A_Z_medicines_dataset_of_India.csv &nbsp;·&nbsp; Max recommended: 50 MB
              </div>
              <div className="upload-btn-row">
                <button className="btn-upload" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                  Choose File
                </button>
              </div>
            </div>
          )}
        </div>

        {uploadResult && (
          <div className="upload-result">
            <div className="upload-result-header">
              <span className="upload-success-icon">✓</span>
              <strong>Upload Complete — {uploadResult.total_rows?.toLocaleString()} medicines loaded</strong>
            </div>
            <div className="upload-preview">
              <span className="preview-label">Preview (first 5 rows):</span>
              <div className="preview-table-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price (₹)</th>
                      <th>Unit Price</th>
                      <th>Rx/OTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.preview?.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td><span className="cat-badge" style={{ background: CATEGORY_COLORS[r.category] + "22", color: CATEGORY_COLORS[r.category] }}>{r.category}</span></td>
                        <td>₹{r.price?.toFixed(2)}</td>
                        <td>₹{r.unit_price_inr?.toFixed(2)}</td>
                        <td><span className={`rx-badge ${r.otc_or_rx === "Rx" ? "rx" : "otc"}`}>{r.otc_or_rx}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FILTERS ── */}
      <div className="filters-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search medicine name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>×</button>
          )}
        </div>

        <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>

        <select className="filter-select" value={otcRx} onChange={(e) => setOtcRx(e.target.value)}>
          <option value="All">OTC + Rx</option>
          <option value="OTC">OTC Only</option>
          <option value="Rx">Rx Only</option>
        </select>

        <select className="filter-select" value={discontinued} onChange={(e) => setDiscontinued(e.target.value)}>
          <option value="All">All Status</option>
          <option value="active">Active Only</option>
          <option value="discontinued">Discontinued Only</option>
        </select>

        {someSelected && (
          <button className="btn-danger-outline" onClick={() => setBulkDeleteConfirm(true)}>
            🗑 Delete {selected.size} selected
          </button>
        )}

        <div className="filter-right">
          <span className="results-count">
            {loading ? "Loading…" : `${total.toLocaleString()} results`}
          </span>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="table-wrap">
        <table className="med-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  title="Select all on this page"
                />
              </th>
              <th className="col-num">#</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Manufacturer</th>
              <th>Pack Size</th>
              <th className="col-price">Price (₹)</th>
              <th className="col-price">Unit Price</th>
              <th className="col-rx">Type</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && medicines.length === 0 ? (
              <tr>
                <td colSpan={11} className="table-empty">
                  <div className="loading-rows">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.07}s` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ) : medicines.length === 0 ? (
              <tr>
                <td colSpan={11} className="table-empty">
                  <div className="empty-state">
                    <div className="empty-icon">💊</div>
                    <div className="empty-title">No medicines found</div>
                    <div className="empty-sub">Upload a CSV above or adjust your filters</div>
                  </div>
                </td>
              </tr>
            ) : (
              medicines.map((med, idx) => (
                <tr
                  key={med._id}
                  className={`med-row ${selected.has(med._id) ? "selected" : ""} ${med.Is_discontinued ? "discontinued" : ""}`}
                >
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={selected.has(med._id)}
                      onChange={() => toggleSelect(med._id)}
                    />
                  </td>
                  <td className="col-num text-muted">{(page - 1) * pageSize + idx + 1}</td>
                  <td>
                    <div className="med-name">{med.name}</div>
                    {med.short_composition1 && (
                      <div className="med-comp">{med.short_composition1}</div>
                    )}
                  </td>
                  <td>
                    <span
                      className="cat-badge"
                      style={{
                        background: (CATEGORY_COLORS[med.category] || "#636e72") + "22",
                        color: CATEGORY_COLORS[med.category] || "#636e72",
                      }}
                    >
                      {med.category || "Other"}
                    </span>
                  </td>
                  <td className="text-muted">{med.manufacturer_name || "—"}</td>
                  <td className="text-muted text-sm">{med.pack_size_label || "—"}</td>
                  <td className="col-price text-right">
                    {med.price != null ? `₹${Number(med.price).toFixed(2)}` : "—"}
                  </td>
                  <td className="col-price text-right fw-600">
                    {med.unit_price_inr != null ? `₹${Number(med.unit_price_inr).toFixed(2)}` : "—"}
                  </td>
                  <td>
                    <span className={`rx-badge ${med.otc_or_rx === "Rx" ? "rx" : "otc"}`}>
                      {med.otc_or_rx || "—"}
                    </span>
                  </td>
                  <td>
                    {med.Is_discontinued ? (
                      <span className="status-badge discontinued-badge">Discontinued</span>
                    ) : (
                      <span className="status-badge active-badge">Active</span>
                    )}
                  </td>
                  <td className="col-actions">
                    <div className="action-btns">
                      <button className="action-btn edit" title="Edit" onClick={() => setEditMed(med)}>
                        ✎
                      </button>
                      <button className="action-btn delete" title="Delete" onClick={() => setDeleteMed(med)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(1)}
          >«</button>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >‹</button>

          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let p;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return p;
          }).map((p) => (
            <button
              key={p}
              className={`page-btn ${p === page ? "active" : ""}`}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}

          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >›</button>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
          >»</button>

          <span className="page-info">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total.toLocaleString()} medicines
          </span>
        </div>
      )}

      <style>{`
        .catalog-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 28px 60px;
          position: relative;
        }

        /* ── TOAST ── */
        .toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          font-size: 0.92rem;
          font-weight: 600;
          animation: slideIn 0.25s ease;
          max-width: 380px;
        }
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: none; opacity: 1; } }
        .toast-success { background: #0f4c45; color: white; }
        .toast-error { background: #c0392b; color: white; }
        .toast-icon { font-weight: 700; font-size: 1rem; }
        .toast-close { background: none; border: none; color: inherit; font-size: 1.2rem; margin-left: auto; cursor: pointer; opacity: 0.8; padding: 0 2px; }

        /* ── HEADER ── */
        .catalog-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .catalog-title {
          font-size: 1.9rem;
          color: var(--color-primary);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .catalog-title-icon { font-size: 1.7rem; }
        .catalog-subtitle { color: var(--color-text-muted); margin-top: 6px; font-size: 0.92rem; }
        .catalog-header-stats { display: flex; gap: 12px; }
        .stat-pill {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-num { font-size: 1.5rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-display); }
        .stat-lbl { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px; }

        /* ── UPLOAD ── */
        .upload-section { margin-bottom: 24px; }
        .drop-zone {
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          padding: 36px 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .drop-zone:hover { border-color: var(--color-primary); background: #f0f9f7; }
        .drop-zone.dragging { border-color: var(--color-accent); background: var(--color-accent-soft); transform: scale(1.01); }
        .drop-zone.uploading { cursor: not-allowed; opacity: 0.8; }
        .upload-state { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .upload-icon { font-size: 2.8rem; }
        .upload-text { font-size: 1rem; color: var(--color-text); }
        .upload-text strong { color: var(--color-primary); }
        .upload-hint { font-size: 0.82rem; color: var(--color-text-muted); }
        .upload-btn-row { margin-top: 4px; }
        .btn-upload {
          padding: 10px 24px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-upload:hover { background: var(--color-primary-light); }
        .upload-spinner {
          width: 40px; height: 40px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .upload-result {
          margin-top: 14px;
          background: #f0fff4;
          border: 1px solid #c6f6d5;
          border-radius: var(--radius-md);
          padding: 16px 20px;
        }
        .upload-result-header { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #276749; margin-bottom: 12px; }
        .upload-success-icon { font-size: 1.2rem; color: #38a169; }
        .preview-label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-muted); display: block; margin-bottom: 8px; }
        .preview-table-wrap { overflow-x: auto; }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .preview-table th { background: #e6ffed; color: #276749; padding: 6px 12px; text-align: left; font-weight: 600; border-bottom: 1px solid #c6f6d5; }
        .preview-table td { padding: 6px 12px; border-bottom: 1px solid #e6ffed; color: var(--color-text); }

        /* ── FILTERS ── */
        .filters-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 220px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.9rem;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 10px 36px 10px 36px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.92rem;
          background: var(--color-surface);
          font-family: var(--font-body);
          transition: border-color 0.15s;
        }
        .search-input:focus { outline: none; border-color: var(--color-primary); }
        .search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.1rem;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0 4px;
        }
        .filter-select {
          padding: 10px 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          background: var(--color-surface);
          color: var(--color-text);
          font-family: var(--font-body);
          cursor: pointer;
          min-width: 140px;
        }
        .filter-select:focus { outline: none; border-color: var(--color-primary); }
        .filter-right { margin-left: auto; }
        .results-count { font-size: 0.85rem; color: var(--color-text-muted); font-weight: 500; white-space: nowrap; }

        .btn-danger-outline {
          padding: 9px 16px;
          border: 1.5px solid var(--color-danger);
          color: var(--color-danger);
          background: transparent;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-danger-outline:hover { background: #fdf0ef; }

        /* ── TABLE ── */
        .table-wrap {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          overflow-x: auto;
          margin-bottom: 16px;
        }
        .med-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.87rem;
          min-width: 900px;
        }
        .med-table thead tr {
          background: #f7f5f0;
          border-bottom: 2px solid var(--color-border);
        }
        .med-table th {
          padding: 12px 14px;
          text-align: left;
          font-weight: 700;
          font-size: 0.78rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .med-row {
          border-bottom: 1px solid var(--color-border);
          transition: background 0.1s;
        }
        .med-row:hover { background: #fafaf8; }
        .med-row.selected { background: #f0f9f7; }
        .med-row.discontinued { opacity: 0.6; }
        .med-table td {
          padding: 10px 14px;
          vertical-align: middle;
        }
        .col-check { width: 40px; }
        .col-num { width: 52px; }
        .col-price { width: 100px; }
        .col-rx { width: 72px; }
        .col-status { width: 110px; }
        .col-actions { width: 90px; }
        .text-muted { color: var(--color-text-muted); }
        .text-sm { font-size: 0.8rem; }
        .text-right { text-align: right; }
        .fw-600 { font-weight: 600; }
        .med-name { font-weight: 600; color: var(--color-text); }
        .med-comp { font-size: 0.76rem; color: var(--color-text-muted); margin-top: 2px; }

        .cat-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .rx-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .rx-badge.rx { background: #fff5f5; color: #c0392b; }
        .rx-badge.otc { background: #f0fff4; color: #276749; }
        .status-badge {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 600;
        }
        .active-badge { background: #f0fff4; color: #276749; }
        .discontinued-badge { background: #fff5f5; color: #c0392b; }

        .action-btns { display: flex; gap: 6px; }
        .action-btn {
          width: 30px; height: 30px;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, transform 0.1s;
        }
        .action-btn:hover { transform: scale(1.1); }
        .action-btn.edit { background: #ebf8ff; color: #2b6cb0; }
        .action-btn.edit:hover { background: #bee3f8; }
        .action-btn.delete { background: #fff5f5; color: #c0392b; }
        .action-btn.delete:hover { background: #fed7d7; }

        /* Skeleton loading */
        .table-empty { padding: 0; }
        .loading-rows { padding: 16px; }
        .skeleton-row {
          height: 44px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          border-radius: var(--radius-sm);
          margin-bottom: 8px;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .empty-state { padding: 48px 24px; text-align: center; }
        .empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .empty-title { font-size: 1.1rem; font-weight: 600; color: var(--color-text); }
        .empty-sub { font-size: 0.87rem; color: var(--color-text-muted); margin-top: 6px; }

        /* ── PAGINATION ── */
        .pagination {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .page-btn {
          min-width: 36px;
          height: 36px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          border-radius: var(--radius-sm);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.15s;
          padding: 0 8px;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
        .page-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-info { font-size: 0.82rem; color: var(--color-text-muted); margin-left: 10px; }

        /* ── MODAL ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } }
        .modal-box {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
          width: 100%;
          max-width: 680px;
          animation: popIn 0.2s ease;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-sm { max-width: 420px; }
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-header h3 { font-size: 1.1rem; color: var(--color-text); }
        .modal-close {
          background: none; border: none; font-size: 1.4rem;
          color: var(--color-text-muted); cursor: pointer; padding: 0 4px;
          line-height: 1;
        }
        .modal-body { padding: 20px 24px; }
        .modal-footer {
          padding: 16px 24px 20px;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .form-field span {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .form-field input, .form-field select {
          padding: 9px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
          transition: border-color 0.15s;
        }
        .form-field input:focus, .form-field select:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .form-field-check {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .form-field-check input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }
        .form-error {
          margin-top: 12px;
          padding: 10px 14px;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: var(--radius-sm);
          color: #c0392b;
          font-size: 0.87rem;
        }

        .btn-primary {
          padding: 10px 22px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: var(--color-primary-light); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost {
          padding: 10px 18px;
          background: transparent;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .btn-ghost:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .btn-danger {
          padding: 10px 22px;
          background: var(--color-danger);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-danger:hover { background: #a93226; }

        @media (max-width: 720px) {
          .catalog-page { padding: 18px 14px 40px; }
          .filters-bar { flex-direction: column; align-items: stretch; }
          .form-grid { grid-template-columns: 1fr; }
          .filter-right { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
