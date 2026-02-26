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
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchHeirs = async () => {
      try {
        const res = await fetch("http://localhost:5000/auth/heirs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (res.ok) {
          // result is the heirs array from your User document
          setBeneficiaries(Array.isArray(result) ? result : []);
        } else {
          console.error("Registry Sync Error:", result.message);
        }
      } catch (err) {
        console.error("Failed to connect to Vault Registry:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeirs();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomineeId) {
      alert("CRITICAL: A designated recipient is required to seal this vault.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/assets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, type, nomineeId, data })
      });

      if (res.ok) {
        alert("Protocol Complete: Asset encrypted and vaulted.");
        navigate("/dashboard");
      } else {
        const errData = await res.json();
        alert(errData.message || "Vaulting failed. Check console for protocol errors.");
      }
    } catch (err) {
      alert("Connection failure to the encryption backend.");
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2 className="logo">LegacyChain</h2>
          <nav className="side-nav">
            <Link to="/dashboard" className="nav-item">Registry Overview</Link>
            <Link to="/create-asset" className="nav-item active">Register New Asset</Link>
            <Link to="/beneficiaries" className="nav-item">Manage Heirs</Link>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <div className="create-asset-container">
          <header className="form-header">
            <h1 className="form-title" style={{ color: '#011f4b' }}>Secure New Asset</h1>
            <p className="form-subtitle">Lock sensitive credentials or documents into the digital vault.</p>
          </header>

          <form onSubmit={handleSubmit} className="asset-form-card">
            <div className="input-group">
              <label>Asset Title</label>
              <input 
                className="vault-input" 
                placeholder="e.g. BTC Seed Phrase or Family Deed"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Designated Recipient (Nominee)</label>
              <select 
                className="vault-input" 
                value={nomineeId} 
                onChange={(e) => setNomineeId(e.target.value)} 
                required
              >
                <option value="">
                  {loading ? "Scanning Registry..." : "Select from Authorized Heirs..."}
                </option>
                
                {beneficiaries?.map((b) => {
                  // BRUTALLY IMPORTANT: We send b._id (the heir entry) 
                  // to the backend, NOT the user._id.
                  const heirEntryId = b._id; 
                  const isVerified = b.status === "VERIFIED" || b.user;
                  const displayName = b.user?.name || "Unregistered Account";

                  return (
                    <option key={heirEntryId} value={heirEntryId}>
                      {isVerified ? "✅ " : "⏳ "} {b.nickname} ({displayName})
                    </option>
                  );
                })}
              </select>
              {beneficiaries.length === 0 && !loading && (
                <p className="input-hint">No nominees found. <Link to="/beneficiaries">Add one first.</Link></p>
              )}
            </div>

            <div className="input-group">
              <label>Asset Classification</label>
              <select 
                className="vault-input" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
              >
                <option value="DOCUMENT">Legal / PDF Document</option>
                <option value="CREDENTIAL">Login / Password</option>
                <option value="CRYPTO">Private Key / Seed Phrase</option>
                <option value="FINANCIAL">Bank Account Details</option>
              </select>
            </div>

            <div className="input-group">
              <label>Vault Content (Encrypted Data)</label>
              <textarea 
                className="vault-input" 
                style={{ minHeight: '140px', fontFamily: 'monospace' }}
                placeholder="Paste the sensitive data to be inherited..."
                value={data} 
                onChange={(e) => setData(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="vault-button" disabled={loading}>
              {loading ? "Initializing..." : "🔒 Seal and Lock Asset"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateAsset;