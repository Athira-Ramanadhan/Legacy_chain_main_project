import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [myVault, setMyVault] = useState([]);
  const [myInheritances, setMyInheritances] = useState([]);
  const [activeTab, setActiveTab] = useState("owner"); // 'owner' or 'heir'
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Logic: Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Logic: Delete Asset
  const handleDeleteAsset = async (assetId) => {
    if (window.confirm("CRITICAL: Permanently wipe this asset from the vault?")) {
      try {
        const res = await fetch(`http://localhost:5000/assets/${assetId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMyVault(myVault.filter((a) => a._id !== assetId));
        }
      } catch (err) {
        console.error("Purge failed", err);
      }
    }
  };

  // Logic: Fetch All Assets (Dual Role)
  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5000/assets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyVault(data.myAssets || []);
        setMyInheritances(data.inheritances || []);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logic: Inspect Asset (Decrypts data)
  const handleInspect = async (assetId) => {
    try {
      const res = await fetch(`http://localhost:5000/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedAsset(data);
        setIsModalOpen(true);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Inspection failed", err);
    }
  };

  useEffect(() => {
    if (!token) navigate("/");
    else fetchDashboardData();
  }, [token]);

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2 className="logo">LegacyChain</h2>
          <nav className="side-nav">
            <Link to="/dashboard" className="nav-item active">Registry Overview</Link>
            <Link to="/create-asset" className="nav-item">Register New Asset</Link>
            <Link to="/beneficiaries" className="nav-item">Manage Heirs</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="sidebar-logout">Terminate Session</button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Estate Dashboard</h1>
            <span className="protocol-badge">● Protocol: Armed</span>
          </div>
          <div className="header-right">
            <div className="readiness-gauge">
              <div className="gauge-circle">{myVault.length}</div>
              <div className="gauge-text">
                <strong>Assets Secured</strong>
                <span>{myInheritances.length} Pending</span>
              </div>
            </div>
            <button onClick={handleLogout} className="header-logout">Secure Sign Out</button>
          </div>
        </header>

        {/* PULSE/HEARTBEAT BANNER */}
        <section className="pulse-banner">
          <div className="pulse-content">
            <h3>Heartbeat Monitoring</h3>
            <p>Verification required. Automated release triggers if inactivity exceeds threshold.</p>
          </div>
          <button className="pulse-btn" onClick={() => alert("Identity Verified. Timer Reset.")}>I AM SECURE</button>
        </section>

        <div className="content-grid">
          <section className="registry-section">
            <div className="section-header">
              <div className="tab-group">
                <button 
                  className={`tab-btn ${activeTab === "owner" ? "active" : ""}`}
                  onClick={() => setActiveTab("owner")}
                >
                  My Vault
                </button>
                <button 
                  className={`tab-btn ${activeTab === "heir" ? "active" : ""}`}
                  onClick={() => setActiveTab("heir")}
                >
                  My Inheritances
                </button>
              </div>
            </div>

            <div className="asset-grid">
              {loading ? <p>Scanning Registry...</p> : (
                (activeTab === "owner" ? myVault : myInheritances).map((asset) => (
                  <div key={asset._id} className={`asset-card ${activeTab === "heir" ? "inheritance-card" : ""}`}>
                    <div className="card-meta">
                      <span className={`status-tag ${asset.status}`}>{asset.status}</span>
                      <span className="type-tag">{asset.type}</span>
                    </div>
                    <h3>{asset.title}</h3>
                    <p className="heir-info">
                      {activeTab === "owner" ? `Nominee: ${asset.nomineeId?.name || 'Loading...'}` : `Owner: ${asset.ownerId?.name || 'Loading...'}`}
                    </p>
                    <div className="card-actions">
                      <button className="btn-inspect" onClick={() => handleInspect(asset._id)}>Inspect</button>
                      {activeTab === "owner" && (
                        <button className="btn-purge" onClick={() => handleDeleteAsset(asset._id)}>Purge</button>
                      )}
                      {activeTab === "heir" && asset.status !== "RELEASED" && (
                        <button className="btn-claim" onClick={() => navigate(`/asset/${asset._id}/claim`)}>Attempt Claim</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SECURITY AUDIT TRAIL SIDEBAR */}
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

      {/* DOCUMENT VIEWER MODAL */}
      {isModalOpen && selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-container">
            <header className="modal-header">
              <h2>Record: {selectedAsset.title}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </header>
            <div className="modal-body">
              <div className="legal-paper">
                <div className="auth-stamp">{selectedAsset.role} VIEW</div>
                <h3>Decrypted Directive</h3>
                <p><strong>Type:</strong> {selectedAsset.type}</p>
                <div className="content-box">
                  {selectedAsset.data || "[Content Locked]"}
                </div>
                <div className="blockchain-meta">
                  <small>Tx Hash: {selectedAsset.txHash}</small>
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