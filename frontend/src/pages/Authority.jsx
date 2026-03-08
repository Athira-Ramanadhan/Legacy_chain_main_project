import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./Authority.css";

const Authority = () => {
  const [pendingAssets, setPendingAssets] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, released: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/assets/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPendingAssets(res.data.pending);
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
    // 🛡️ Nuke the session data
    localStorage.clear();

    // 🏠 Redirect to the Landing/Home page
    window.location.href = "/";
  };
  const handleVerify = async (id, action) => {
    const loadId = toast.loading(
      `${action === "APPROVE" ? "Verifying Proof..." : "Rejecting Claim..."}`,
    );
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/assets/${id}/verify`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Protocol Updated: Asset ${action}ED`, { id: loadId });
      fetchAdminData();
    } catch (err) {
      toast.error("Finality Error: Transaction failed on-chain.", {
        id: loadId,
      });
    }
  };

  return (
    <div className="authority-portal">
      <Toaster />
      <div className="auth-sidebar">
        <h2>LegacyChain</h2>
        <div className="status-indicator">● System: Mainnet-Sim</div>
        <div className="admin-stats">
          <div className="stat-card">
            <h3>{stats.pending}</h3>
            <p>Awaiting Audit</p>
          </div>
          <div className="stat-card">
            <h3>{stats.released}</h3>
            <p>Released Legacies</p>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Exit Terminal
        </button>
      </div>

      <main className="auth-content">
        <header>
          <h1>⚖️ Legal Authority Terminal</h1>
          <p>
            Reviewing cross-chain asset transfer requests and death certificate
            validity [cite: 2026-03-07].
          </p>
        </header>

        <section className="verification-queue">
          <h3>Verification Queue</h3>
          {pendingAssets.length === 0 ? (
            <p className="empty">No pending claims detected.</p>
          ) : (
            // ✅ CORRECTED TABLE STRUCTURE
            <table className="auth-table">
              <thead>
                <tr>
                  <th>Asset & Owner</th>
                  <th>Evidence (IPFS/S3)</th>
                  <th>Blockchain ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {" "}
                {/* 1. Move this OUTSIDE the loop */}
                {pendingAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <strong>{asset.title}</strong>
                      <br />
                      <small>{asset.ownerId?.email}</small>
                    </td>
                    <td>
                      <a
                        href={`http://localhost:5000/${asset.deathCertificateUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="view-link"
                      >
                        Open Document 📄
                      </a>
                    </td>
                    <td className="mono-text">
                      {asset.txHash ? asset.txHash.substring(0, 12) : "N/A"}...
                    </td>
                    <td>
                      <button
                        className="btn-approve"
                        onClick={() => handleVerify(asset._id, "APPROVE")}
                      >
                        Verify
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleVerify(asset._id, "REJECT")}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>{" "}
              {/* 2. Move this OUTSIDE the loop */}
            </table>
          )}
        </section>

        {/* 🔗 THE SECOND OPTION: BLOCKCHAIN AUDIT TRAIL */}
        <section className="blockchain-audit">
          <h3>Immutable Audit Trail</h3>
          <div className="audit-logs">
            <div className="log-entry">
              <span className="timestamp">
                [{new Date().toLocaleTimeString()}]
              </span>
              <span className="message">
                {" "}
                NODE_01: Monitoring Smart Contract 0x71C...a4f3 [cite:
                2026-03-07]
              </span>
            </div>
            {pendingAssets.map((asset) => (
              <div className="log-entry" key={asset.txHash}>
                <span className="timestamp">[PENDING]</span>
                <span className="message">
                  {" "}
                  ASSET_REG: {asset.txHash} verified on database [cite:
                  2026-03-07].
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Authority;
