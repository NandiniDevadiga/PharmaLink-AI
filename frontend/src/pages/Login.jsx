import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("pharmacy");
  const [pharmacyId, setPharmacyId] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const unameClean = username.trim();
    
    try {
      if (isRegistering) {
        // Validation for registration
        if (!unameClean) throw new Error("Username cannot be empty.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        
        if (role === "pharmacy") {
          if (!pharmacyId.trim()) throw new Error("Pharmacy ID is required.");
          if (!pharmacyName.trim()) throw new Error("Pharmacy Name is required.");
        }

        await api.register(
          unameClean,
          password,
          role,
          role === "pharmacy" ? pharmacyId.trim() : null,
          role === "pharmacy" ? pharmacyName.trim() : null
        );

        setSuccessMsg("Registration successful! You can now log in below.");
        setIsRegistering(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        // Validation for login
        if (!unameClean) throw new Error("Username is required.");
        if (!password) throw new Error("Password is required.");

        await login(unameClean, password);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(user, pass) {
    setUsername(user);
    setPassword(pass);
    setIsRegistering(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 6 5 10.5 5 14a7 7 0 0014 0c0-3.5-3-8-7-12z" fill="var(--color-accent)"/>
            <circle cx="12" cy="14.5" r="2.4" fill="var(--color-primary)"/>
          </svg>
          <span>{isRegistering ? "Staff Registration" : "Pharmacy Staff Login"}</span>
        </div>
        <p className="login-sub">
          {isRegistering 
            ? "Create an account for a new pharmacy branch manager or head office administrator."
            : "This area is for pharmacy staff and head office only. Customers won't find this link anywhere on the public site."}
        </p>

        {successMsg && <div className="login-success">{successMsg}</div>}
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Role
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="role-select"
              >
                <option value="pharmacy">Pharmacy Branch Manager</option>
                <option value="admin">Head Office Admin</option>
              </select>
            </label>
          )}

          <label>
            Username
            <input
              type="text"
              placeholder="e.g. ph001 or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>

          {isRegistering && role === "pharmacy" && (
            <>
              <label>
                Pharmacy ID
                <input
                  type="text"
                  placeholder="e.g. PH013"
                  value={pharmacyId}
                  onChange={(e) => setPharmacyId(e.target.value)}
                />
              </label>
              <label>
                Pharmacy Name
                <input
                  type="text"
                  placeholder="e.g. Andheri East Chemist"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                />
              </label>
            </>
          )}

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {isRegistering && (
            <label>
              Confirm Password
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading 
              ? (isRegistering ? "Registering..." : "Signing in...") 
              : (isRegistering ? "Register Account" : "Sign in")}
          </button>
        </form>

        <div className="toggle-auth-mode">
          {isRegistering ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="btn-toggle-link"
                onClick={() => { setIsRegistering(false); setError(null); setSuccessMsg(null); }}
              >
                Login here
              </button>
            </span>
          ) : (
            <span>
              Need a new account?{" "}
              <button
                type="button"
                className="btn-toggle-link"
                onClick={() => { setIsRegistering(true); setError(null); setSuccessMsg(null); }}
              >
                Register here
              </button>
            </span>
          )}
        </div>

        {!isRegistering && (
          <div className="demo-box">
            <p className="demo-title">Demo accounts (for your viva / testing)</p>
            <button type="button" className="demo-chip" onClick={() => fillDemo("ph001", "pharma123")}>
              Branch: ph001 / pharma123
            </button>
            <button type="button" className="demo-chip" onClick={() => fillDemo("admin", "admin123")}>
              Head Office: admin / admin123
            </button>
          </div>
        )}
      </div>

      <style>{`
        .login-page {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: var(--color-bg);
        }
        .login-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 36px;
          max-width: 420px;
          width: 100%;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--color-primary);
        }
        .login-sub {
          margin-top: 10px;
          color: var(--color-text-muted);
          font-size: 0.88rem;
          line-height: 1.5;
        }
        form { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }
        label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
        input, .role-select {
          padding: 12px 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-family: var(--font-body);
          background: var(--color-surface);
        }
        input:focus, .role-select:focus { border-color: var(--color-primary-light); }
        .login-error {
          background: #FBEAE8;
          color: var(--color-danger);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-top: 14px;
        }
        .login-success {
          background: #EDF6F1;
          color: var(--color-success);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-top: 14px;
          border: 1px solid #CFE6DA;
        }
        .btn-login {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 13px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .btn-login:hover { background: var(--color-primary-light); }
        .btn-login:disabled { opacity: 0.6; }
        .toggle-auth-mode {
          margin-top: 16px;
          text-align: center;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }
        .btn-toggle-link {
          background: none;
          border: none;
          color: var(--color-primary);
          text-decoration: underline;
          padding: 0;
          font-weight: 600;
          cursor: pointer;
        }
        .demo-box {
          margin-top: 26px;
          padding-top: 20px;
          border-top: 1px dashed var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .demo-title { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
        .demo-chip {
          background: var(--color-accent-soft);
          border: none;
          padding: 9px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          color: #966319;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }
        .demo-chip:hover { background: var(--color-accent); color: #3A2700; }
      `}</style>
    </div>
  );
}

