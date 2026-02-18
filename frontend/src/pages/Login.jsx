import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./Login.css";

const Login = ({ isOpen, onClose, onSwitchToRegister }) => {

  const navigate = useNavigate();

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
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", escHandler);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", escHandler);
    };

  }, [isOpen, onClose, isSubmitting]);


  if (!isOpen) return null;


  /* ===== Input change handler ===== */
  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

  };


  /* ===== Validation ===== */
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


  /* ===== Login submit handler ===== */
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validate()) return;

    try {

      setIsSubmitting(true);

      const response = await fetch(
        "http://localhost:5000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        setErrors({
          email: data.message || "Login failed",
        });

        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      alert("Login successful");

      // Close modal
      onClose();

      // Navigate to Dashboard
      navigate("/dashboard");

    }
    catch (error) {

      console.error(error);

      setErrors({
        email: "Server error",
      });

    }
    finally {

      setIsSubmitting(false);

    }

  };


  /* ===== UI ===== */
  return (

    <div
      className="modal-overlay"
      onClick={!isSubmitting ? onClose : undefined}
    >

      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="modal-close"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ×
        </button>


        <div className="auth-card">

          <h2>Welcome Back</h2>

          <p className="auth-subtitle">
            Sign in to access your account
          </p>


          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            <div className={`form-group ${errors.email ? "error" : ""}`}>

              <label>Email *</label>

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />

              {errors.email && (
                <span className="error">
                  {errors.email}
                </span>
              )}

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
                <span className="error">
                  {errors.password}
                </span>
              )}

            </div>


            <button
              className="primary-btn full"
              disabled={isSubmitting}
            >
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
