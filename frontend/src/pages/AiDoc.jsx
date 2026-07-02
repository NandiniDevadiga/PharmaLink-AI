import { useState } from "react";
import { api } from "../api/client";

const QUICK_CONDITIONS = [
  "diabetes", "high blood pressure", "cold", "acidity", "obesity",
];

export default function AiDoc() {
  const [condition, setCondition] = useState("");
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchAdvice(value) {
    const c = (value ?? condition).trim();
    if (!c) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdvice(c);
      setAdvice(data);
      setCondition(c);
    } catch (err) {
      setError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aidoc-page">
      <section className="aidoc-hero">
        <h1>AI Doc — lifestyle guidance, not prescriptions.</h1>
        <p className="hero-sub">
          Tell me a condition and I'll suggest food and activity dos and don'ts.
          AI Doc never recommends medicines — for that, always consult a licensed doctor or pharmacist.
        </p>

        <form className="search-row" onSubmit={(e) => { e.preventDefault(); fetchAdvice(); }}>
          <input
            type="text"
            placeholder="e.g. diabetes, acidity, high blood pressure..."
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            aria-label="Health condition"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Thinking..." : "Get Advice"}
          </button>
        </form>

        <div className="quick-chips">
          <span className="chip-label">Quick try:</span>
          {QUICK_CONDITIONS.map((c) => (
            <button key={c} className="chip" onClick={() => fetchAdvice(c)} type="button">
              {c}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="alert-error">{error}</div>}

      {advice && (
        <section className="advice-section">
          <div className="disclaimer-banner">⚕️ {advice.disclaimer}</div>

          <h2>Lifestyle guidance for "{advice.condition}"</h2>

          <div className="advice-grid">
            <div className="advice-card do-card">
              <h3>🍽️ Food — Do</h3>
              <ul>{advice.food_dos.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="advice-card dont-card">
              <h3>🍽️ Food — Avoid</h3>
              <ul>{advice.food_donts.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="advice-card do-card">
              <h3>🏃 Activity — Do</h3>
              <ul>{advice.activity_dos.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="advice-card dont-card">
              <h3>🏃 Activity — Avoid</h3>
              <ul>{advice.activity_donts.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          </div>
        </section>
      )}

      <style>{`
        .aidoc-page { max-width: 1100px; margin: 0 auto; padding: 48px 32px 80px; }
        .aidoc-hero h1 { font-size: 2.2rem; color: var(--color-primary); max-width: 680px; }
        .hero-sub {
          margin-top: 12px; color: var(--color-text-muted); max-width: 600px;
          font-size: 1.02rem; line-height: 1.5;
        }
        .search-row { display: flex; gap: 10px; margin-top: 28px; max-width: 600px; }
        .search-row input {
          flex: 1; padding: 14px 16px; border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md); font-size: 1rem; font-family: var(--font-body);
          background: var(--color-surface);
        }
        .search-row input:focus { border-color: var(--color-primary-light); }
        .btn-primary {
          background: var(--color-primary); color: white; border: none;
          padding: 14px 26px; border-radius: var(--radius-md); font-weight: 600;
          font-size: 0.98rem; transition: background 0.15s;
        }
        .btn-primary:hover { background: var(--color-primary-light); }
        .btn-primary:disabled { opacity: 0.6; cursor: default; }
        .quick-chips { margin-top: 18px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .chip-label { font-size: 0.85rem; color: var(--color-text-muted); margin-right: 4px; }
        .chip {
          background: var(--color-accent-soft); border: none; padding: 6px 14px;
          border-radius: 20px; font-size: 0.85rem; color: #966319; font-weight: 600;
          text-transform: capitalize;
        }
        .chip:hover { background: var(--color-accent); color: #3A2700; }
        .alert-error {
          margin-top: 24px; background: #FBEAE8; color: var(--color-danger);
          padding: 14px 18px; border-radius: var(--radius-md); font-size: 0.92rem;
        }
        .advice-section { margin-top: 40px; }
        .disclaimer-banner {
          background: #EDF6F1; color: var(--color-primary); border: 1px solid #CFE6DA;
          padding: 12px 18px; border-radius: var(--radius-md); font-size: 0.88rem;
          margin-bottom: 24px;
        }
        .advice-section h2 {
          font-size: 1.2rem; font-family: var(--font-body); font-weight: 700;
          margin-bottom: 18px; text-transform: capitalize;
        }
        .advice-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;
        }
        .advice-card {
          background: var(--color-surface); border-radius: var(--radius-lg);
          padding: 20px; border: 1px solid var(--color-border);
        }
        .advice-card h3 { font-size: 1rem; font-family: var(--font-body); margin-bottom: 12px; }
        .do-card { border-left: 4px solid var(--color-success); }
        .dont-card { border-left: 4px solid var(--color-danger); }
        .advice-card ul { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
        .advice-card li { font-size: 0.9rem; line-height: 1.4; color: var(--color-text); }
      `}</style>
    </div>
  );
}
