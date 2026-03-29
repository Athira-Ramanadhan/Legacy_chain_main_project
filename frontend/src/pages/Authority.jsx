import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./Authority.css";

const Authority = () => {
  const [pendingAssets, setPendingAssets] = useState([]);
  const [vetoedAssets, setVetoedAssets] = useState([]); // 🛡️ Audit State
  const [stats, setStats] = useState({ total: 0, pending: 0, released: 0, grace: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/assets/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingAssets(res.data.pending);
      setVetoedAssets(res.data.vetoed || []); // 🛡️ Capture Vetoed History
      setStats(res.data.stats);
    } catch (err) {
      toast.error("Security Breach: Unauthorized access to Authority Portal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleTriggerVeto = async (id) => {
    const loadId = toast.loading("Sending Veto Alert to Owner...");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/assets/${id}/trigger-veto`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Owner Notified. Grace Period Started.", { id: loadId });
      fetchAdminData(); 
    } catch (err) {
      toast.error("Failed to initiate protocol.", { id: loadId });
    }
  };

  const handleFinalizeRelease = async (id) => {
    const loadId = toast.loading("Finalizing Asset Release...");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/assets/${id}/verify-final`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Asset Released to Nominee.", { id: loadId });
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification Failed.", { id: loadId });
    }
  };

  const handleReject = async (id) => {
    const loadId = toast.loading("Executing Rejection Protocol...");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://localhost:5000/assets/${id}/verify`, { action: "REJECT" }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Protocol Updated: Claim Rejected", { id: loadId });
      fetchAdminData();
    } catch (err) {
      toast.error("Error processing rejection.", { id: loadId });
    }
  };

  return (
    <div className="authority-portal">
      <Toaster />
      <div className="auth-sidebar">
        <h2>LegacyChain</h2>
        
        <div className="admin-stats">
          <div className="stat-card">
            <h3>{stats.pending}</h3>
            <p>Awaiting Audit</p>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #d4af37' }}>
            <h3>{stats.grace || 0}</h3>
            <p>In Grace Period</p>
          </div>
          <div className="stat-card">
            <h3>{stats.released}</h3>
            <p>Released Legacies</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
      </div>

      <main className="auth-content">
        <header>
          <h1>⚖️ Legal Authority </h1>
          
        </header>

        <section className="verification-queue">
          <h3>Verification Queue (Active Claims)</h3>
          {pendingAssets.length === 0 ? (
            <p className="empty">No active claims currently require your review.</p>
          ) : (
            <table className="auth-table">
              <thead>
                <tr>
                  <th>Asset & Owner</th>
                  <th>Evidence </th>
                  <th>Current Status</th>
                  <th>Security Protocol</th>
                </tr>
              </thead>
              <tbody>
                {pendingAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <strong>{asset.title}</strong>
                      <br /><small>{asset.ownerId?.email}</small>
                    </td>
                    <td>
                      <a href={`http://localhost:5000/${asset.deathCertificateUrl}`} target="_blank" rel="noreferrer" className="view-link">
                        Open Document 📄
                      </a>
                    </td>
                    <td>
                      {asset.status === "PENDING_RELEASE" ? (
                        <span className="status-tag warning">⏳ Grace Period Active</span>
                      ) : (
                        <span className="status-tag info">📄 New Claim</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {asset.status === "PENDING_ADMIN" && (
                          <button className="btn-approve" onClick={() => handleTriggerVeto(asset._id)} style={{ backgroundColor: "#011f4b", color: "white" }}>
                            📢 Send Veto Alert
                          </button>
                        )}
                        {asset.status === "PENDING_RELEASE" && (
                          <button className="btn-verify-gold" onClick={() => handleFinalizeRelease(asset._id)} style={{ backgroundColor: "#d4af37", color: "black", fontWeight: "bold" }}>
                            ✅ Finalize Release
                          </button>
                        )}
                        <button className="btn-reject" onClick={() => handleReject(asset._id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 🛡️ NEW SECTION: THE VETO LOG [cite: 2026-03-08] */}
        <section className="verification-queue" style={{ marginTop: '40px' }}>
          <h3 style={{ color: '#dc2626' }}>🛡️ Security Intervention Log (Recent Vetoes)</h3>
          {vetoedAssets.length === 0 ? (
            <p className="empty">No security interventions recorded.</p>
          ) : (
            <table className="auth-table veto-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Owner</th>
                  <th>Event Type</th>
                  <th>Final Result</th>
                </tr>
              </thead>
              <tbody>
                {vetoedAssets.map(log => (
                  <tr key={log._id} style={{ opacity: 0.8, backgroundColor: '#fff5f5' }}>
                    <td>{log.title}</td>
                    <td>{log.ownerId?.name || "Verified Owner"}</td>
                    <td><span className="status-tag" style={{ backgroundColor: '#dc2626', color: 'white' }}>HEARTBEAT_VETO</span></td>
                    <td style={{ color: '#dc2626', fontWeight: 'bold' }}>CLAIM_REVOKED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="blockchain-audit">
          <h3>Immutable Audit Trail</h3>
          <div className="audit-logs">
            <div className="log-entry">
              <span className="timestamp">[{new Date().toLocaleTimeString()}]</span>
              <span className="message"> NODE_01: Monitoring Smart Contract 0x71C...a4f3 </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Authority;