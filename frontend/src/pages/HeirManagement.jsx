import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddNomineeModal from "./AddNomineeModal";
import "./Dashboard.css";

const HeirManagement = () => {
  const [heirs, setHeirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchHeirs = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/heirs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Ensure we handle the data correctly even if it's empty
      if (res.ok) setHeirs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Critical Failure: Could not sync with Registry.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (email) => {
    if (
      window.confirm(
        `SECURITY ALERT: This will permanently revoke access for ${email}. Proceed?`,
      )
    ) {
      try {
        const res = await fetch(`http://localhost:5000/auth/heirs/${email}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          alert("Access keys purged.");
          setHeirs(heirs.filter((h) => h.email !== email));
        }
      } catch (err) {
        alert("Action failed: Handover protocol in deadlock.");
      }
    }
  };

  useEffect(() => {
    if (!token) navigate("/");
    else fetchHeirs();
  }, [token]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <h2 className="logo">LegacyChain</h2>
          <nav className="side-nav">
            <Link to="/dashboard" className="nav-item">
              Registry Overview
            </Link>
            <Link to="/create-asset" className="nav-item">
              Register Asset
            </Link>
            <Link to="/beneficiaries" className="nav-item active">
              Manage Nominees
            </Link>
          </nav>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
          className="sidebar-logout"
        >
          Terminate Session
        </button>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Nominee Registry</h1>
            <p className="protocol-badge">
              ● System Status: Encrypted & Active
            </p>
          </div>
          <button className="pulse-btn" onClick={() => setIsModalOpen(true)}>
            + Link New Nominee
          </button>
        </header>

        <section className="registry-section">
          <div className="table-container">
            <table className="heir-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Designation</th>
                  <th>Security Challenge</th>
                  <th>Vault Status</th>
                  <th style={{ textAlign: "right" }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="table-loader">
                      Decrypting Ledger...
                    </td>
                  </tr>
                ) : heirs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">
                      No active nominations found.
                    </td>
                  </tr>
                ) : (
                  heirs.map((h) => (
                    <tr key={h._id || h.email}>
                      <td>
                        <div className="user-info">
                         
                          <span
                            className="user-name"
                            style={{ display: "block", fontWeight: "bold" }}
                          >
                            {h.user?.name || "Awaiting Registration"}
                          </span>
                          <span
                            className="user-email"
                            style={{ fontSize: "0.8rem", color: "#666" }}
                          >
                            {h.email}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{h.nickname}</strong>
                      </td>
                      <td>
                        <div className="security-col">
                          <p className="challenge-q">Q: {h.secretQuestion}</p>
                          <p className="challenge-h">
                            Hint: {h.hint || "None"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={`status-tag ${h.status}`}>
                          {h.status === "VERIFIED"
                            ? "Verified"
                            : "Pending Sync"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-purge"
                          onClick={() => handleRevoke(h.email)}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <AddNomineeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNomineeAdded={fetchHeirs}
      />
    </div>
  );
};

export default HeirManagement;
