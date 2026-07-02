import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "../api/client";

const COLORS = ["#0F4C45", "#E8A33D", "#3D8361", "#C1473B", "#1A6B5F", "#966319", "#5C6E6A", "#7BA89F"];

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <h3 className="kpi-value" style={accent ? { color: accent } : undefined}>{value}</h3>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topDrugs, setTopDrugs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [otcRx, setOtcRx] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [s, t, c, td, b, ls, or_] = await Promise.all([
          api.getDashboardSummary(),
          api.getSalesTrend("monthly"),
          api.getCategoryBreakdown(),
          api.getTopDrugs(8),
          api.getBranchPerformance(),
          api.getLowStock(20),
          api.getOtcVsRx(),
        ]);
        setSummary(s);
        setTrend(t);
        setCategories(c);
        setTopDrugs(td);
        setBranches(b);
        setLowStock(ls);
        setOtcRx(or_);
      } catch (err) {
        setError("Could not load dashboard data. Make sure the backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) return <div className="dash-loading">Loading dashboard…</div>;
  if (error) return <div className="dash-error">{error}</div>;

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div>
          <h1>Pharmacy Dashboard</h1>
          <p className="dash-sub">Network performance across {summary.active_pharmacies} branches · 12-month view</p>
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="Total Revenue" value={`₹${(summary.total_revenue_inr / 100000).toFixed(2)}L`} sub="last 12 months" />
        <KpiCard label="Transactions" value={summary.total_transactions.toLocaleString()} sub="orders processed" />
        <KpiCard label="Avg Order Value" value={`₹${summary.avg_order_value_inr}`} sub="per transaction" />
        <KpiCard label="Units Sold" value={summary.total_units_sold.toLocaleString()} sub="across all branches" />
        <KpiCard label="Low Stock Alerts" value={summary.low_stock_alerts} sub="below 20 units" accent="var(--color-danger)" />
      </div>

      <div className="chart-grid">
        <div className="chart-card wide">
          <h3>Revenue Trend (Monthly)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue_inr" stroke="#0F4C45" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>OTC vs Prescription</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={otcRx} dataKey="revenue_inr" nameKey="otc_or_rx" cx="50%" cy="50%" outerRadius={85} label={(d) => d.otc_or_rx}>
                {otcRx.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="revenue_inr" radius={[0, 6, 6, 0]}>
                {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top Selling Drugs</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topDrugs} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
              <XAxis dataKey="drug_name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v} units`} />
              <Bar dataKey="units_sold" fill="#E8A33D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card wide">
          <h3>Branch Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branches} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
              <XAxis dataKey="area" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} height={80} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="revenue_inr" fill="#1A6B5F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lowstock-section">
        <h3>⚠️ Low Stock Items (below 20 units)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pharmacy</th>
                <th>Drug</th>
                <th>Category</th>
                <th>Stock Left</th>
                <th>Price/Unit</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.slice(0, 12).map((item, i) => (
                <tr key={i}>
                  <td>{item.pharmacy_name}</td>
                  <td>{item.drug_name}</td>
                  <td><span className="cat-tag">{item.category}</span></td>
                  <td className={item.stock_qty < 5 ? "stock-critical" : "stock-low"}>{item.stock_qty}</td>
                  <td>₹{item.unit_price_inr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dashboard-page { max-width: 1300px; margin: 0 auto; padding: 40px 32px 80px; }
        .dash-loading, .dash-error { padding: 80px; text-align: center; color: var(--color-text-muted); }
        .dash-error { color: var(--color-danger); }
        .dash-header h1 { font-size: 1.9rem; color: var(--color-primary); }
        .dash-sub { color: var(--color-text-muted); margin-top: 6px; }

        .kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-top: 28px;
        }
        .kpi-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 18px 20px;
        }
        .kpi-label { font-size: 0.78rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
        .kpi-value { font-size: 1.6rem; margin-top: 6px; color: var(--color-primary); font-family: var(--font-display); }
        .kpi-sub { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 4px; }

        .chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
          margin-top: 28px;
        }
        .chart-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 20px;
        }
        .chart-card.wide { grid-column: span 2; }
        .chart-card h3 { font-size: 0.95rem; font-family: var(--font-body); font-weight: 700; margin-bottom: 14px; }

        @media (max-width: 900px) {
          .chart-grid { grid-template-columns: 1fr; }
          .chart-card.wide { grid-column: span 1; }
        }

        .lowstock-section {
          margin-top: 28px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 20px;
        }
        .lowstock-section h3 { font-size: 0.95rem; margin-bottom: 14px; color: var(--color-danger); }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
        th { text-align: left; padding: 8px 10px; color: var(--color-text-muted); font-weight: 600; border-bottom: 1px solid var(--color-border); font-size: 0.78rem; text-transform: uppercase; }
        td { padding: 9px 10px; border-bottom: 1px solid var(--color-border); }
        .cat-tag { background: var(--color-accent-soft); color: #966319; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; }
        .stock-low { color: var(--color-accent); font-weight: 700; }
        .stock-critical { color: var(--color-danger); font-weight: 700; }
      `}</style>
    </div>
  );
}
