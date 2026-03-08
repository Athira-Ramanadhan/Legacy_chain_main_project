import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// ✅ 1. Re-add props so Landing.jsx can control the modal [cite: 2026-03-08]
const Login = ({ isOpen, onClose, onSwitchToRegister }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 2. THE MODAL GUARD: If Landing says 'closed', return nothing (Fixes white screen) [cite: 2026-03-08]
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const err = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      err.email = "Enter a valid email address";
    }
    if (!formData.password) {
      err.password = "Password is required";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ email: data.message || "Login failed" });
        return;
      }

      if (data && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user?.role || "user");
        localStorage.setItem("userEmail", data.user?.email || formData.email);

        // ✅ 3. Close the modal on success [cite: 2026-03-08]
        onClose();

        // 🚦 4. Role-Based Redirection [cite: 2026-03-08]
        if (data.user?.role === "admin") {
          navigate("/authority");
        } else if (data.user?.role === "nominee") {
          navigate("/nominee-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrors({ email: "Server error. Is the backend running?" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // ✅ 5. Restore the modal overlay for the pop-up effect [cite: 2026-03-08]
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to secure your LegacyChain</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className={`form-group ${errors.email ? "error" : ""}`}>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className={`form-group ${errors.password ? "error" : ""}`}>
            <label>Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button className="primary-btn full" disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Login to Vault"}
          </button>
        </form>

        <p className="auth-footer">
          Don’t have an account?{" "}
          <button type="button" className="link-btn" onClick={onSwitchToRegister}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;