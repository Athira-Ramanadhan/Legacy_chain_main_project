import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./ClaimAsset.css";

const ClaimAsset = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(2); // 1: Upload, 2: Question, 3: Reveal
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState("");
  const [decryptedData, setDecryptedData] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAssetInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/assets/${id}/inspect`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAsset(res.data);
      } catch (err) {
        toast.error("Unauthorized access to this asset.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAssetInfo();
  }, [id, token, navigate]);

  // Phase 1: Simulate Document Verification
  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please upload a Death Certificate.");
    
    const loadingToast = toast.loading("Verifying document authenticity...");
    
    // Simulating backend processing/OCR check
    setTimeout(() => {
      toast.success("Document Verified against Registry.", { id: loadingToast });
      setStep(2);
    }, 3000);
  };

  // Phase 2: Security Challenge
   const handleClaim = async (e) => {
  e.preventDefault();
  const loadingToast = toast.loading("Validating security protocol...");

  try {
    const res = await axios.post(
      `http://localhost:5000/assets/${id}/claim`,
      { answer },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Identity Confirmed. Vault Unlocked.", { id: loadingToast });
    setDecryptedData(res.data.data);
    setStep(3);
  } catch (err) {
    // 🛡️ Detailed Error Handling [cite: 2026-03-08]
    const message = err.response?.data?.message || "Verification Failed.";
    toast.error(message, { id: loadingToast, duration: 5000 }); // Show for 5 seconds [cite: 2026-03-08]
  }
};

  if (loading) return <div className="loading">Scanning Secure Channels...</div>;

  return (
    <div className="claim-container">
      <Toaster position="top-center" />
      
      <div className="claim-card">
        <header className="claim-header">
          <h2>Secure Asset Claim</h2>
          <p>Asset ID: <span className="mono">{id}</span></p>
        </header>

        {/* STEP 1: DOCUMENT UPLOAD */}
        {step === 1 && (
          <form className="claim-step" onSubmit={handleUpload}>
            <div className="security-icon">📜</div>
            <h3>Legal Verification Required</h3>
            <p>To proceed, please upload a valid Death Certificate of the Asset Owner.</p>
            <input 
              type="file" 
              accept=".pdf,.jpg,.png" 
              onChange={(e) => setFile(e.target.files[0])} 
              className="file-input"
            />
            <button type="submit" className="btn-verify">Initiate Verification</button>
          </form>
        )}

        {/* STEP 2: SECRET QUESTION */}
        {step === 2 && (
          <form className="claim-step" onSubmit={handleClaim}>
            <div className="security-icon">🔑</div>
            <h3>Security Challenge</h3>
            <p className="question-text"><strong>Question:</strong> {asset?.secretQuestion}</p>
            <input 
              type="text" 
              placeholder="Your answer..." 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="text-input"
              required
            />
            <button type="submit" className="btn-unlock">Unlock Vault</button>
          </form>
        )}

        {/* STEP 3: DATA REVEAL */}
        {step === 3 && (
          <div className="claim-step reveal-animation">
            <div className="security-icon">🔓</div>
            <h3>Asset Content Released</h3>
            <div className="data-box">
              <pre>{decryptedData}</pre>
            </div>
            <button onClick={() => window.print()} className="btn-print">Print Record</button>
            <p className="blockchain-note">This transfer is recorded on the Blockchain.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimAsset;