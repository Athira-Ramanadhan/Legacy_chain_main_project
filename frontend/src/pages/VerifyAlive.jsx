import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const VerifyAlive = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const urlToken = searchParams.get("token");
  const localToken = localStorage.getItem("token");
  const activeToken = urlToken || localToken;

  // --- REPLACE YOUR CURRENT useEffect WITH THIS ---
useEffect(() => {
  // 1. Grab token from URL immediately [cite: 2026-03-08]
  const urlTokenFromQuery = searchParams.get("token");

  if (urlTokenFromQuery) {
    // 2. Persist it so the "auth" guards don't kick you out [cite: 2026-03-08]
    localStorage.setItem("token", urlTokenFromQuery);
    console.log("✅ Token anchored from URL.");
  } else if (!localStorage.getItem("token")) {
    // 3. Only redirect if BOTH are missing (URL and LocalStorage) [cite: 2026-03-08]
    console.log("🚫 No token found, redirecting...");
    navigate("/login?message=session_required");
  }
}, [searchParams, navigate]);
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>🛡️</div>
          <h2 style={styles.title}>Security Check-In</h2>
          <p style={styles.subtitle}>
            Your **Dead Man's Switch** has been triggered. Please verify your identity to reset the timer.
          </p>
        </div>

        <form onSubmit={handleVerify} style={styles.form}>
          <label style={styles.label}>Account Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? "Verifying..." : "Confirm I Am Alive"}
          </button>
        </form>

        <div style={styles.footer}>
          <p>Failure to verify within the grace period will trigger asset release.</p>
        </div>
      </div>
    </div>
  );
};

// Professional CSS-in-JS Styles
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a", // Slate 900
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: "#1e293b", // Slate 800
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    maxWidth: "400px",
    width: "100%",
    border: "1px solid #334155",
  },
  header: { textAlign: "center", marginBottom: "30px" },
  iconCircle: {
    fontSize: "40px",
    marginBottom: "15px",
    display: "inline-block",
    padding: "20px",
    borderRadius: "50%",
    backgroundColor: "#1e1b4b",
    border: "2px solid #6366f1",
  },
  title: { color: "#f8fafc", fontSize: "24px", fontWeight: "700", margin: "10px 0" },
  subtitle: { color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" },
  form: { display: "flex", flexDirection: "column" },
  label: { color: "#cbd5e1", fontSize: "12px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    color: "#fff",
    marginBottom: "20px",
    outline: "none",
    fontSize: "16px",
  },
  button: {
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#6366f1", // Indigo 500
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  footer: { marginTop: "25px", textAlign: "center", color: "#64748b", fontSize: "12px", fontStyle: "italic" }
};

export default VerifyAlive;