import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const Dashboard = () => {
  const [myVault, setMyVault] = useState([]);

  const [activeTab, setActiveTab] = useState("owner"); // 'owner' or 'heir'
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isWillOpen, setIsWillOpen] = useState(false);
  const [lastVerified, setLastVerified] = useState("Never");
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Logic: Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Logic: Fetch All Assets
  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5000/assets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Fetch directly from storage to be safe
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setMyVault(data.myAssets || []);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logic: Heartbeat (Reset Safety Timer)
  const handleHeartbeat = async () => {
  // 🛡️ Remove assetId from the parameter, we are doing a GLOBAL reset
  try {
    const res = await axios.post(
      `http://localhost:5000/assets/heartbeat/global`, // ✅ Match the backend route
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (res.status === 200) {
      const now = new Date().toLocaleString();
      setLastVerified(now);
      toast.success("❤️ Presence Confirmed. ALL pending claims cancelled.");
      
      // 🔄 Refresh your asset list to show statuses going from "APPROVED" back to "LOCKED"
      if (typeof fetchMyAssets === 'function') fetchMyAssets(); 
    }
  } catch (err) {
    console.error("Global Heartbeat failed:", err);
    toast.error("Failed to update security status.");
  }
};

  // Logic: Delete Asset
  const handleDeleteAsset = async (assetId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this? It will be removed from your Final Will.",
      )
    ) {
      const loadingToast = toast.loading("Wiping data from vault...");
      try {
        const res = await fetch(`http://localhost:5000/assets/${assetId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setMyVault((prev) => prev.filter((a) => a._id !== assetId));
          toast.success("Asset deleted successfully!", { id: loadingToast });
        } else {
          toast.error("Failed to delete. Try again.", { id: loadingToast });
        }
      } catch (err) {
        toast.error("System Error: Could not reach server.", {
          id: loadingToast,
        });
      }
    }
  };

  // Logic: Inspect Asset
  const handleInspect = async (assetId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/assets/${assetId}/inspect`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setSelectedAsset(data);
        setIsModalOpen(true);
      } else {
        toast.error(data.message || "Unauthorized access.");
      }
    } catch (err) {
      console.error("Inspection failed:", err);
    }
  };

  // Run on Mount
  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      fetchDashboardData();
    }
  }, [token]);

  useEffect(() => {
    if (location.state?.defaultTab === "heir") {
      setActiveTab("heir"); // Switches from 'owner' to 'heir' tab
      toast.success("Welcome to your Inheritance Vault");
    }
  }, [location]);

  return (
    <div className="layout">
      {/* 1. Global Toaster for Notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2 className="logo">LegacyChain</h2>
          <nav className="side-nav">
            {/* 1. Standard Owner Links */}
            <Link to="/dashboard" className="nav-item">
              Registry Overview
            </Link>
            <Link to="/create-asset" className="nav-item">
              Register New Asset
            </Link>
            <Link to="/beneficiaries" className="nav-item">
              Manage Heirs
            </Link>

            {/* 2. ✅ THE FIX: Link to your SEPARATE Nominee Dashboard */}
            <Link
              to="/nominee-dashboard"
              className="nav-item"
              onClick={() => setLoading(true)} // Optional: show loader while switching
            >
              🎁 Switch to Nominee Portal
            </Link>

            {/* 3. Final Will (Shared) */}
            <div
              className="nav-item"
              onClick={() => setIsWillOpen(true)}
              style={{ cursor: "pointer", color: "#fcd34d" }}
            >
              📜 View My Final Will
            </div>
          </nav>
        </div>
        <button onClick={handleLogout} className="sidebar-logout">
          Terminate Session
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            {/* ✅ DYNAMIC TITLE */}
            <h1>Estate Dashboard</h1>
            <span className="protocol-badge">● Protocol: Armed</span>
          </div>
          <div className="header-right">
            <div className="readiness-gauge">
              {/* The line '// ✅ TO:' was deleted because it causes a syntax error */}
              <div className="gauge-circle">{myVault.length}</div>
              <div className="gauge-text">
                <strong>Assets Secured</strong>
                <span>Vault Status: Protected</span>
              </div>
            </div>
            <button onClick={handleLogout} className="header-logout">
              Secure Sign Out
            </button>
          </div>
        </header>

        {/* HEARTBEAT BANNER */}
        <section className="pulse-banner">
          <div className="pulse-content">
            <h3>Heartbeat Monitoring</h3>
            <p>
              Verification required. Automated release triggers if inactivity
              exceeds threshold.
            </p>
          </div>
          <button
            className="pulse-btn"
            onClick={() =>
              toast.info("Inspect an asset to verify your safety.")
            }
          >
            I AM SECURE
          </button>
        </section>

        <div className="content-grid">
          <section className="registry-section">
            <div className="section-header"></div>
            <div className="asset-grid">
              {loading ? (
                <p>Scanning Registry...</p>
              ) : (
                myVault.map((asset) => (
                  <div key={asset._id} className="asset-card">
                    <div className="card-meta">
                      <span className={`status-tag ${asset.status}`}>
                        {asset.status}
                      </span>
                      <span className="type-tag">{asset.type}</span>
                    </div>
                    {/* Rest of your card content... */}

                    <h3>{asset.title}</h3>
                    <p className="heir-info">
                      {activeTab === "owner"
                        ? `Nominee: ${asset.nomineeName || asset.nomineeEmail || "Unregistered"}`
                        : `Owner: ${asset.ownerId?.name || "Unknown Owner"}`}
                    </p>
                    <div className="card-actions">
                      <button
                        className="btn-inspect"
                        onClick={() => handleInspect(asset._id)}
                      >
                        Inspect
                      </button>
                      {activeTab === "owner" && (
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteAsset(asset._id)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                          }}
                        >
                          Delete
                        </button>
                      )}
                      {activeTab === "heir" && asset.status !== "RELEASED" && (
                        <button
                          className="btn-claim"
                          onClick={() => navigate(`/asset/${asset._id}/claim`)}
                        >
                          Attempt Claim
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="audit-trail">
            <h3>System Status</h3>
            <div className="audit-list">
              <div className="audit-item">
                <span className="audit-time">Live</span>
                <p>Blockchain Node Connected</p>
              </div>
              <div className="audit-item warning">
                <span className="audit-time">Registry</span>
                <p>{myVault.length} Assets Encrypted</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* INSPECT MODAL */}
      {isModalOpen && selectedAsset && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <header
              className="modal-header"
              style={{ backgroundColor: "#011F4B" }}
            >
              <h2>Viewing Secured Asset</h2>
              <button
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </header>
            <div
              className="modal-body"
              style={{ textAlign: "center", padding: "40px" }}
            >
              <div style={{ fontSize: "50px" }}>
                {selectedAsset.type === "Document" ? "📄" : "💰"}
              </div>
              <h1 style={{ color: "#011F4B" }}>{selectedAsset.title}</h1>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "15px",
                  borderRadius: "12px",
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{ color: "#166534", fontWeight: "bold", margin: "0" }}
                >
                  ✅ VAULT PROTECTION ACTIVE
                </p>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#15803d",
                    marginTop: "5px",
                  }}
                >
                  Last Presence Check: {lastVerified}
                </p>
              </div>
              <div className="simple-card-box">
                <p>
                  <strong>Nominee:</strong>{" "}
                  {selectedAsset.nomineeName || selectedAsset.nomineeEmail}
                </p>
              </div>
              <div
                className="simple-card-box"
                style={{ backgroundColor: "#f1f5f9", padding: "20px" }}
              >
                <p>
                  {selectedAsset.status === "LOCKED"
                    ? "🔒 This content is encrypted."
                    : selectedAsset.data}
                </p>
              </div>
              <button
                onClick={() => handleHeartbeat(selectedAsset._id)}
                className="pulse-btn"
                style={{
                  marginTop: "20px",
                  width: "100%",
                  background: "#16a34a",
                  padding: "15px",
                  color: "white",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                I AM ALIVE (Reset Safety Timer)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WILL MODAL */}
      {isWillOpen && (
        <div className="modal-overlay" onClick={() => setIsWillOpen(false)}>
          <div
            className="modal-container"
            style={{ maxWidth: "850px", height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-header">
              <h2>My Digital Testament</h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="print-btn" onClick={() => window.print()}>
                  Print
                </button>
                <button
                  className="close-btn"
                  onClick={() => setIsWillOpen(false)}
                >
                  &times;
                </button>
              </div>
            </header>
            <div
              className="modal-body"
              style={{
                padding: "40px",
                background: "#f8fafc",
                overflowY: "auto",
              }}
            >
              <div className="traditional-will-paper">
                <h1 style={{ fontFamily: "Georgia", textAlign: "center" }}>
                  Last Will and Testament
                </h1>
                <p style={{ textAlign: "center" }}>
                  <i>Official Record of Digital Distribution</i>
                </p>
                <hr />
                <div className="will-assignment-list">
                  {myVault.length > 0 ? (
                    myVault.map((asset, index) => (
                      <div
                        key={asset._id}
                        style={{
                          padding: "20px",
                          marginBottom: "15px",
                          borderLeft: "5px solid #011F4B",
                          background: "#fff",
                        }}
                      >
                        <p>
                          <strong>Gift {index + 1}:</strong> I assign my{" "}
                          <u>{asset.title}</u>
                        </p>
                        <p style={{ color: "#16a34a", fontSize: "1.2rem" }}>
                          ➜ <strong>To be given to:</strong>{" "}
                          {asset.nomineeName || asset.nomineeEmail}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p>No assets found.</p>
                  )}
                </div>
                <div className="will-footer" style={{ marginTop: "50px" }}>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <div
                    style={{
                      marginTop: "30px",
                      borderTop: "1px solid #000",
                      width: "200px",
                    }}
                  >
                    <p>Owner's Signature</p>
                  </div>
                  <div className="wax-seal">LEGACY SEALED</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
