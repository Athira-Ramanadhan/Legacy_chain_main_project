import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Register.css";

const Register = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: null,
    govIdType: "Aadhaar",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});

  /* ================= Modal behavior ================= */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";

    const escHandler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", escHandler);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", escHandler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /* ================= Helpers ================= */
  const getPasswordStrength = () => {
    let score = 0;
    if (formData.password.length >= 8) score += 25;
    if (/[a-z]/.test(formData.password)) score += 25;
    if (/[A-Z]/.test(formData.password)) score += 25;
    if (/\d/.test(formData.password)) score += 12.5;
    if (/[@$!%*?&]/.test(formData.password)) score += 12.5;

    if (score < 25) return "weak";
    if (score < 50) return "fair";
    if (score < 75) return "good";
    return "strong";
  };

  const getStrengthWidth = () =>
    Math.min(
      (formData.password.match(/[A-Z]/) ? 25 : 0) +
        (formData.password.match(/[a-z]/) ? 25 : 0) +
        (formData.password.match(/\d/) ? 25 : 0) +
        (formData.password.length >= 8 ? 25 : 0),
      100
    );

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
    setFormData((prev) => ({
      ...prev,
      dob: date,
    }));
    setErrors((prev) => ({ ...prev, dob: "" }));
  };

  const validate = () => {
    const err = {};
    if (!formData.fullName.trim()) err.fullName = "Full name required";
    if (!/^[6-9]\d{9}$/.test(formData.phone)) err.phone = "Invalid mobile number";
    if (!formData.email.includes("@")) err.email = "Invalid email";
    if (!formData.dob) err.dob = "DOB required";
    if (formData.password.length < 8) err.password = "Weak password";
    if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";
    if (!formData.agree) err.agree = "Accept terms";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log("Registered:", formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Secure your digital legacy</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {[
              ["fullName", "Full Legal Name", "text"],
              ["email", "Email Address", "email"],
              ["phone", "Mobile Number", "tel"],
            ].map(([name, label, type]) => (
              <div key={name} className={`form-group ${errors[name] ? "error" : ""}`}>
                <label>{label} *</label>
                <input type={type} name={name} value={formData[name]} onChange={handleChange} />
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
                yearDropdownItemNumber={50}
                scrollableYearDropdown
                maxDate={new Date()}
                minDate={new Date(1900, 0, 1)}
                className="date-picker-input"
              />
              {errors.dob && <span className="error">{errors.dob}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} />
              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className={`strength-bar ${getPasswordStrength()}`}
                    style={{ width: `${getStrengthWidth()}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group checkbox">
              <input type="checkbox" name="agree" checked={formData.agree} onChange={handleChange} />
              <label>I agree to the Terms & Privacy Policy</label>
            </div>
            {errors.agree && <span className="error">{errors.agree}</span>}

            <button className="primary-btn full">Register</button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

Register.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Register;
