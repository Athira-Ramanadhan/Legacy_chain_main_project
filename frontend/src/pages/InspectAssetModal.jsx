const InspectAssetModal = ({ asset, isOpen, onClose, onHeartbeat }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "3rem" }}>🛡️</div>
          <h2 style={{ color: "#011F4B" }}>Vault Security Audit</h2>
          <span className="status-tag RELEASED">SECURED BY BLOCKCHAIN</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div className="info-box" style={cardStyle}>
            <p><strong>🎁 Asset Name:</strong> {asset.title}</p>
            <p><strong>👤 Assigned To:</strong> {asset.nomineeName}</p>
            <p><strong>📧 Contact:</strong> {asset.nomineeEmail}</p>
          </div>

          <div className="info-box" style={cardStyle}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem" }}>HANDOVER PROTOCOL</h4>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              If you are inactive for 30 days, <strong>{asset.nomineeName}</strong> will be 
              required to answer your security question to unlock this gift.
            </p>
            <p style={{ marginTop: "10px" }}><strong>❓ Question:</strong> {asset.secretQuestion || "Security Challenge Active"}</p>
          </div>

          <button 
            onClick={() => onHeartbeat(asset._id)}
            className="btn-claim"
            style={{ width: "100%", padding: "12px", background: "#16a34a" }}
          >
            I AM ALIVE (Confirm Safety)
          </button>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: "#f8fafc",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0"
};