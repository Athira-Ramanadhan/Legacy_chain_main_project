import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./Login.css";

const Login = ({ isOpen, onClose, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ===== Modal behavior ===== */
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const escHandler = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };

    window.addEventListener("keydown", escHandler);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", escHandler);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  /* ===== Handlers ===== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const err = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      err.email = "Enter a valid email address";

    if (!formData.password) err.password = "Password is required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      // 🔌 Replace with real API
      await new Promise((res) => setTimeout(res, 1200));

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ×
        </button>

        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your account</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className={`form-group ${errors.email ? "error" : ""}`}>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className={`form-group ${errors.password ? "error" : ""}`}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>

            <button className="primary-btn full" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Login"}
            </button>
          </form>
          <p className="auth-footer">
            Don’t have an account?{" "}
            <button
              type="button"
              className="link-btn"
              onClick={onSwitchToRegister}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSwitchToRegister: PropTypes.func.isRequired,
};

export default Login;
