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

  const fetchInheritances = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined") {
      setLoading(false);
      return toast.error("Unauthorized. Please login again.");
    }

    try {
      const res = await axios.get(
        "http://localhost:5000/assets/my-inheritances",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
      await axios.post(
        `http://localhost:5000/assets/${assetId}/upload-cert`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
        
          },
        },
      );
      toast.success("Submitted. Awaiting Admin Approval.", { id: loadId });
      fetchInheritances();
    } catch (err) {
      toast.error("Upload failed.", { id: loadId });
    } finally {
      setUploadingId(null);
    }
  };

  const getProgress = (status) => {
    const stages = {
      LOCKED: 20,
      PENDING_ADMIN: 40,
      APPROVED: 60, // Admin said yes
      PENDING_RELEASE: 70, // 🛡️ Waiting for Grace Period
      RELEASED: 100,
    };
    return stages[status] || 0;
  };

  return (
    <div className="nominee-dashboard">
      <Toaster position="top-center" />

      <aside className="nominee-sidebar">
        <div className="sidebar-brand">
          <h2>LegacyChain</h2>
          <span className="badge">Nominee Portal</span>
        </div>

        {/* NEW: Sidebar Stats Widget */}
        <div className="sidebar-stats">
          <div className="stat-item">
            <span>Active Legacies</span>
            <strong>{inheritances.length}</strong>
          </div>
          <div className="stat-item">
            <span>Status</span>
            <strong style={{ color: "#4ade80" }}>System Live</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-link active">📋 My Inheritances</button>
          <button className="nav-link" onClick={() => navigate("/dashboard")}>
            🔄 Switch to Owner View
          </button>
        </nav>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          🚪 Logout
        </button>
      </aside>

      <main className="nominee-main">
        <header className="nominee-header">
          <h1>Active Legacies</h1>
          <p>Secure blockchain-backed inheritances entrusted to your care.</p>
        </header>

        <section className="inheritance-grid">
          {loading ? (
            <div className="loader">🔄 Querying Blockchain Ledger...</div>
          ) : inheritances.length > 0 ? (
            inheritances.map((asset) => (
              <div
                key={asset._id}
                className={`nominee-card ${asset.status.toLowerCase()}`}
              >
                <h3>{asset.title}</h3>
                <p className="owner-name">
                  Entrusted by:{" "}
                  <strong>{asset.ownerId?.name || "Private Owner"}</strong>
                </p>

                {/* NEW: Progress Tracker */}
                <div className="progress-container">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${getProgress(asset.status)}%` }}
                    ></div>
                  </div>
                  <div className="progress-steps">
                    <span>Locked</span>
                    <span>Review</span>
                    <span>Released</span>
                  </div>
                </div>

                <div className="card-actions">
                  {/* NEW: Public Legal Note */}
                  <div className="legal-note">
                    <p>
                      <strong>Owner Note:</strong> "The keys to our legacy are
                      held in this vault."
                    </p>
                  </div>

                  {asset.status === "LOCKED" && (
                    <div className="locked-msg">
                      <p>
                        🔒 Vault is currently locked by active heartbeat
                        monitoring.
                      </p>
                    </div>
                  )}

                  {(asset.status === "CLAIM_READY" ||
                    asset.status === "LOCKED") && (
                    <div className="upload-section">
                      <label className="upload-btn">
                        {uploadingId === asset._id
                          ? "⏳ Verifying..."
                          : "📎 Upload Death Certificate"}
                        <input
                          type="file"
                          onChange={(e) =>
                            handleFileUpload(asset._id, e.target.files[0])
                          }
                          disabled={uploadingId === asset._id}
                          hidden
                        />
                      </label>
                    </div>
                  )}

                  {asset.status === "PENDING_ADMIN" && (
                    <div className="pending-msg">
                      <p>⏳ Submission under legal audit...</p>
                    </div>
                  )}
                  {asset.status === "PENDING_RELEASE" && (
                    <div className="grace-period-notice">
                      <p>
                        ⏳ <strong>Security Grace Period Active</strong>
                      </p>
                      <small>
                        The owner has been notified. If no veto is received, the
                        vault unlocks on:
                        <br />
                        <strong>
                          {new Date(
                            new Date(asset.claimStartedAt).getTime() +
                              asset.gracePeriod * 86400000,
                          ).toLocaleString()}
                        </strong>
                      </small>
                      <button
                        className="claim-btn highlight"
                        onClick={() => navigate(`/claim/${asset._id}`)}
                        style={{ marginTop: "15px", background: "#f59e0b" }}
                      >
                        📂 Finalize Security Challenge
                      </button>
                    </div>
                  )}
                  {/* ✅ Stage 1: Admin approved, but Grace Period is still ticking */}
                  {asset.status === "APPROVED" && (
                    <div className="waiting-container">
                      <button className="claim-btn disabled" disabled>
                        🔒 Pending Grace Period
                      </button>
                      <p className="tiny-alert">
                        Vault will unlock automatically once the security timer
                        expires.
                      </p>
                    </div>
                  )}

                  {/* ✅ Stage 2: Grace Period over, vault is physically open */}
                  {asset.status === "RELEASED" && (
                    <button
                      className="claim-btn success"
                      onClick={() => navigate(`/claim/${asset._id}`)}
                    >
                      📂 Access Inherited Data
                    </button>
                  )}
                </div>

                {/* NEW: Audit Trail Footer */}
                <div className="card-footer">
                  <span>Standard: AES-256-CBC</span>
                  <span>Network: Ethereum/Poly</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No assigned legacies found.</p>
              <small>
                This portal will activate once you are designated as a nominee.
              </small>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default NomineeDashboard;
