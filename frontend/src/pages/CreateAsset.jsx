import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./CreateAsset.css"; 
import "./Dashboard.css"; 

const CreateAsset = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState("");
  const [type, setType] = useState("DOCUMENT");
  const [nomineeId, setNomineeId] = useState("");
  const [data, setData] = useState("");
  const [file, setFile] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const isFileType = type === "DOCUMENT" || type === "SENTIMENTAL";

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const fetchHeirs = async () => {
      try {
        const res = await fetch("http://localhost:5000/auth/heirs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        // 🛠️ FIX: Ensure we handle both array and object responses [cite: 2026-03-08]
        if (res.ok) setBeneficiaries(Array.isArray(result) ? result : result.heirs || []);
      } catch (err) { 
        console.error("Registry Sync Error:", err);
      } finally { setLoading(false); }
    };
    fetchHeirs();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomineeId) { alert("Nominee required!"); return; }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      formData.append("nomineeId", nomineeId);

      if (isFileType && file) {
        formData.append("vaultFile", file); 
      } else {
        formData.append("data", data);
      }

      const res = await fetch("http://localhost:5000/assets/create", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: formData
      });

      if (res.ok) {
        alert("Protocol Complete: Asset vaulted.");
        navigate("/dashboard");
      } else {
        const errData = await res.json();
        alert(errData.message || "Vaulting failed.");
      }
    } catch (err) { alert("Connection failure."); }
  };

  return (
    <div className="layout">
      {/* Sidebar logic assumed to be external or handled by Layout */}
      <main className="main-content">
        <div className="create-asset-container">
          <form onSubmit={handleSubmit} className="asset-form-card">
            <h2 className="form-title">Secure New Asset</h2>
            <p className="form-subtitle">Lock sensitive data or documents in the digital vault.</p>

            {/* 🛠️ ADDED: ASSET TITLE FIELD [cite: 2026-03-08] */}
            <div className="input-group">
              <label>Asset Name / Title</label>
              <input 
                type="text" 
                className="vault-input" 
                placeholder="e.g., Property Deed 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>

            {/* 🛠️ ADDED: NOMINEE SELECTOR [cite: 2026-03-08] */}
            <div className="input-group">
              <label>Designated Nominee</label>
              <select 
                className="vault-input" 
                value={nomineeId} 
                onChange={(e) => setNomineeId(e.target.value)} 
                required
              >
                <option value="">-- Select Beneficiary --</option>
                {beneficiaries.map(heir => (
                  <option key={heir._id} value={heir._id}>
                    {heir.fullName || heir.nickname} ({heir.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Asset Classification</label>
              <select className="vault-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="DOCUMENT">Legal / PDF Document</option>
                <option value="SENTIMENTAL">Photo</option>
                <option value="CREDENTIAL">Login / Password</option>
                <option value="CRYPTO">Private Key </option>
              </select>
            </div>

            <div className="input-group">
              <label>{isFileType ? "Upload File (PDF/Image)" : "Vault Content (Encrypted Data)"}</label>
              {isFileType ? (
                <input 
                  type="file" 
                  className="vault-input" 
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files[0])} 
                  required 
                />
              ) : (
                <textarea 
                  className="vault-input" 
                  style={{ minHeight: '140px', fontFamily: 'monospace' }}
                  placeholder="Paste the sensitive data here..."
                  value={data} 
                  onChange={(e) => setData(e.target.value)} 
                  required 
                />
              )}
            </div>

            <button type="submit" className="vault-button" disabled={loading}>
              {loading ? "Syncing Registry..." : "🔒 Seal and Lock Asset"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateAsset;