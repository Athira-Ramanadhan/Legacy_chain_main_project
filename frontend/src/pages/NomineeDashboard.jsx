import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./NomineeDashboard.css";

const NomineeDashboard = () => {
  const [inheritances, setInheritances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const navigate = useNavigate();

  // Filters for the different sections [cite: 2026-03-10]
  const activeClaims = inheritances.filter(
    (a) => a.status === "PENDING_RELEASE" || a.status === "RELEASED" || a.status === "PENDING_ADMIN"
  );
  const vaultedAssets = inheritances.filter((a) => a.status === "LOCKED");

  const fetchInheritances = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined") {
      setLoading(false);
      return toast.error("Unauthorized. Please login again.");
    }

    try {
      const res = await axios.get("http://localhost:5000/assets/my-inheritances", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInheritances(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired.");
        localStorage.clear();
        navigate("/login");
      } else {
        toast.error("Failed to load legacies.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchInheritances();
  }, [fetchInheritances]);

  const handleFileUpload = async (assetId, file) => {
    if (!file) return;
    const token = localStorage.getItem("token");
    setUploadingId(assetId);
    const formData = new FormData();
    formData.append("deathCertificate", file);

    const loadId = toast.loading("Uploading to Secure Registry...");
    try {
      await axios.post(`http://localhost:5000/assets/${assetId}/upload-cert`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Submitted. Awaiting Admin Approval.", { id: loadId });
      fetchInheritances();
    } catch (err) {
      toast.error("Upload failed.", { id: loadId });
    } finally {
      setUploadingId(null);
    }
  };

  const getProgress = (status) => {
    const stages = { LOCKED: 20, PENDING_ADMIN: 40, APPROVED: 60, PENDING_RELEASE: 70, RELEASED: 100 };
    return stages[status] || 0;
  };

  return (
    <div className="nominee-dashboard">
      <Toaster position="top-center" />

      {/* 📍 SIDEBAR */}
      <aside className="nominee-sidebar">
        <div className="sidebar-brand">
          <h2>LegacyChain</h2>
          <span className="badge">Nominee Portal</span>
        </div>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span>Active Legacies</span>
            <strong>{inheritances.length}</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-link active">📋 My Inheritances</button>
          <button className="nav-link" onClick={() => navigate("/dashboard")}>
            🔄 Switch to Owner View
          </button>
        </nav>

        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>
          🚪 Logout
        </button>
      </aside>

      {/* 💻 MAIN CONTENT */}
      <main className="nominee-main">
        <header className="nominee-header">
          <h1>Active Legacies</h1>
          <p>Secure blockchain-backed inheritances entrusted to your care.</p>
        </header>

        <section className="nominee-content">
          {loading ? (
            <div className="loader">🔄 Querying Blockchain Ledger...</div>
          ) : (
            <>
              {/* SECTION 1: ACTIVE CLAIMS */}
              <h2 className="section-divider">🚀 Active Legacies (Action Required)</h2>
              <div className="inheritance-grid"> {/* 🟢 GRID WRAPPER FIX [cite: 2026-03-10] */}
                {activeClaims.length > 0 ? (
                  activeClaims.map((asset) => (
                    <div key={asset._id} className="nominee-card">
                      <div className="card-top">
                        <h3>{asset.title}</h3>
                        <p className="owner-name">Entrusted by: <strong>{asset.ownerId?.name || "Private Owner"}</strong></p>
                      </div>

                      <div className="progress-container">
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${getProgress(asset.status)}%` }}></div>
                        </div>
                        <div className="progress-steps">
                          <span>Locked</span>
                          <span>Review</span>
                          <span style={{ color: asset.status === "RELEASED" ? "#10b981" : "inherit" }}>Released</span>
                        </div>
                      </div>

                      <div className="legal-note">
                        <p><strong>Note:</strong> "{asset.ownerNote || 'The keys to our legacy are held in this vault.'}"</p>
                      </div>

                      <div className="card-actions">
                        {asset.status === "RELEASED" && (
                          <button className="claim-btn success" onClick={() => navigate(`/claim/${asset._id}`)}>
                            📂 Access Inherited Data
                          </button>
                        )}
                        {asset.status === "PENDING_ADMIN" && <div className="pending-msg">⏳ Under Legal Audit...</div>}
                      </div>

                      <div className="card-footer">
                        <span>AES-256-CBC</span>
                        <span>ETHEREUM/POLY</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">No active claims currently in progress.</p>
                )}
              </div>

              {/* SECTION 2: PROTECTED VAULT */}
              <h2 className="section-divider" style={{ marginTop: "40px" }}>🔒 Secured in Vault (Protected)</h2>
              <div className="inheritance-grid" style={{ opacity: 0.8 }}>
                {vaultedAssets.length > 0 ? (
                  vaultedAssets.map((asset) => (
                    <div key={asset._id} className="nominee-card locked" style={{ borderLeft: "5px solid #64748b" }}>
                      <div className="locked-badge">🛡️ VETO PROTECTED</div>
                      <h3>{asset.title}</h3>
                      <p className="owner-name">Owner: <strong>{asset.ownerId?.name || "Verified Owner"}</strong></p>
                      
                      <div className="legal-note" style={{ borderLeftColor: "#64748b" }}>
                        <p>🔒 Vault is locked by active heartbeat monitoring.</p>
                      </div>

                      <label className="claim-btn highlight" style={{ background: "#475569", cursor: "pointer", display: "block", textAlign: "center" }}>
                        {uploadingId === asset._id ? "⏳ Verifying..." : "📎 Re-initiate Claim"}
                        <input type="file" onChange={(e) => handleFileUpload(asset._id, e.target.files[0])} disabled={uploadingId === asset._id} hidden />
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No protected assets found.</div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default NomineeDashboard;