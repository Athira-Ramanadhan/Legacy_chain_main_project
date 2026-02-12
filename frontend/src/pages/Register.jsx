import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Register.css";


  const Register = ({ isOpen, onClose, onSwitchToLogin }) =>  {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: null,
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= Modal behavior ================= */
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

  /* ================= Password strength ================= */
  const passwordScore = () => {
    let score = 0;
    if (formData.password.length >= 8) score += 25;
    if (/[a-z]/.test(formData.password)) score += 25;
    if (/[A-Z]/.test(formData.password)) score += 25;
    if (/\d/.test(formData.password)) score += 25;
    return score;
  };

  const passwordStrength = () => {
    const score = passwordScore();
    if (score <= 25) return "weak";
    if (score <= 50) return "fair";
    if (score <= 75) return "good";
    return "strong";
  };

  /* ================= Events ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dob: date }));
    setErrors((prev) => ({ ...prev, dob: "" }));
  };

  /* ================= Validation ================= */
  const validate = () => {
    const err = {};

    if (!formData.fullName.trim()) err.fullName = "Full name is required";

    if (!/^[6-9]\d{9}$/.test(formData.phone))
      err.phone = "Enter a valid Indian mobile number";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      err.email = "Enter a valid email address";

    if (!formData.dob) err.dob = "Date of birth is required";

    if (passwordScore() < 75) err.password = "Password is too weak";

    if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";

    if (!formData.agree) err.agree = "You must accept the terms";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* ================= Submit ================= */
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  try {

    setIsSubmitting(true);

    const response = await fetch("http://localhost:5000/auth/register", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      }),

    });

    const data = await response.json();

    if (!response.ok) {

      setErrors({
        email: data.message || "Registration failed",
      });

      return;
    }

    alert("Registration successful");

    onClose();

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

  return (
    <div
      className="modal-overlay"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative" }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close"
        >
          ×
        </button>

        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Secure your digital legacy</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {[
              ["fullName", "Full Legal Name", "text"],
              ["email", "Email Address", "email"],
              ["phone", "Mobile Number", "tel"],
            ].map(([name, label, type]) => (
              <div
                key={name}
                className={`form-group ${errors[name] ? "error" : ""}`}
              >
                <label htmlFor={name}>{label} *</label>
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                />
                {errors[name] && <span className="error">{errors[name]}</span>}
              </div>
            ))}

            <div className={`form-group ${errors.dob ? "error" : ""}`}>
              <label>Date of Birth *</label>
              <DatePicker
                selected={formData.dob}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select your date of birth"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                className="date-picker-input"
              />
              {errors.dob && <span className="error">{errors.dob}</span>}
            </div>

            <div className={`form-group ${errors.password ? "error" : ""}`}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className={`strength-bar ${passwordStrength()}`}
                    style={{ width: `${passwordScore()}%` }}
                  />
                </div>
              </div>
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>

            <div
              className={`form-group ${errors.confirmPassword ? "error" : ""}`}
            >
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </div>

            <div
              className={`form-group checkbox ${errors.agree ? "error" : ""}`}
            >
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
              />
              <label>I agree to the Terms & Privacy Policy</label>
            </div>
            {errors.agree && <span className="error">{errors.agree}</span>}

            <button className="primary-btn full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Register"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <button
              type="button"
              className="link-btn"
              onClick={onSwitchToLogin}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

Register.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
};


export default Register;
