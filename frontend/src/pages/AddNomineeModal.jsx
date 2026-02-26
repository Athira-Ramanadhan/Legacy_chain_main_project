import { useState } from "react";

const AddNomineeModal = ({ isOpen, onClose, onNomineeAdded }) => {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [hint, setHint] = useState(""); // 1. Hint state is here
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/auth/add-heir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          nickname,
          secretQuestion,
          secretAnswer,
          hint, // 2. MUST include hint in the body!
        }),
      });

      if (res.ok) {
        // Reset all fields
        setEmail("");
        setNickname("");
        setSecretQuestion("");
        setSecretAnswer("");
        setHint(""); 
        onNomineeAdded();
        onClose();
      } else {
        alert("Authorization Failed: Protocol Rejected.");
      }
    } catch (err) {
      alert("Vault Connection Error.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff", color: "#011F4B", fontSize: "0.95rem", marginTop: "6px",
    boxSizing: "border-box", display: "block",
  };

  const labelStyle = {
    fontSize: "0.7rem", fontWeight: "800", color: "#011F4B", 
    textTransform: "uppercase", letterSpacing: "0.5px",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ height: "auto", maxWidth: "480px" }}>
        <div className="modal-body">
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <span className="status-tag RELEASED">Security Protocol</span>
            <h2 style={{ color: "#011F4B", marginTop: "10px", fontSize: "1.4rem" }}>Nominee Authorization</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div className="input-group">
              <label style={labelStyle}>Nominee Email</label>
              <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <label style={labelStyle}>Role</label>
              <input type="text" style={inputStyle} value={nickname} onChange={(e) => setNickname(e.target.value)} required />
            </div>

            <hr style={{ border: "0", borderTop: "1px dashed #e2e8f0", margin: "10px 0" }} />

            {/* SECURITY CHALLENGE SECTION */}
            <div className="input-group">
              <label style={labelStyle}>Identity Challenge Question</label>
              <input type="text" style={inputStyle} value={secretQuestion} onChange={(e) => setSecretQuestion(e.target.value)} placeholder="e.g. First school name?" required />
            </div>

            {/* 3. THE HINT INPUT (VISIBLE TO NOMINEE LATER) */}
            <div className="input-group">
              <label style={labelStyle}>Security Hint (Optional)</label>
              <input type="text" style={inputStyle} value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g. It was in downtown" />
            </div>

            <div className="input-group">
              <label style={labelStyle}>Challenge Answer</label>
              <input type="text" style={inputStyle} value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)} required />
            </div>

            <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button type="submit" disabled={loading} className="btn-claim" style={{ width: "100%", padding: "16px", fontWeight: "bold" }}>
                {loading ? "EXECUTING..." : "AUTHORIZE NOMINEE"}
              </button>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.8rem" }}>
                Cancel and Return
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNomineeModal;