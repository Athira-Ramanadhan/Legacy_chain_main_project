import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {

  // FIX: Proper state declaration
  const [assets, setAssets] = useState([]);
  const [statusMap, setStatusMap] = useState({});

  const navigate = useNavigate();

  const token = localStorage.getItem("token");


  // ================= Logout =================

  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/");

  };


  // ================= Fetch assets =================

  const fetchAssets = async () => {

    try {

      const res = await fetch("http://localhost:5000/assets", {

        headers: {
          Authorization: `Bearer ${token}`,
        },

      });

      const data = await res.json();

      if (!Array.isArray(data)) {

        setAssets([]);
        return;

      }

      setAssets(data);

      data.forEach((asset) => {

        if (asset._id) {
          fetchStatus(asset._id);
        }

      });

    }
    catch (err) {

      console.error(err);

    }

  };


  // ================= Fetch Deadman status =================

  const fetchStatus = async (assetId) => {

    try {

      const res = await fetch(

        `http://localhost:5000/assets/${assetId}/status`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }

      );

      const data = await res.json();

      setStatusMap((prev) => ({

        ...prev,

        [assetId]: data.deadmanStatus,

      }));

    }
    catch (err) {

      console.error(err);

    }

  };


  // ================= Claim asset =================

  const claimAsset = async (assetId) => {

    try {

      const res = await fetch(

        `http://localhost:5000/assets/${assetId}/claim`,

        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }

      );

      const data = await res.json();

      alert(data.message);

      fetchAssets();

    }
    catch (err) {

      console.error(err);

    }

  };


  // ================= Load on start =================

  useEffect(() => {

    if (!token) {

      navigate("/");

      return;

    }

    fetchAssets();

  }, []);


  // ================= UI =================

  return (

    <div className="dashboard">

      <header className="dash-header">

        <h2>LegacyChain</h2>

        <div className="user-info">

          <span>Status: Connected</span>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>

        </div>

      </header>


      <main className="dash-main">

        <h1>Your Assets</h1>


        <Link to="/create-asset" className="primary-action">
          Create New Asset
        </Link>


        {assets.length === 0 && (

          <p>No assets found</p>

        )}


        <div className="asset-grid">

          {assets.map((asset) => (

            <div key={asset._id} className="card">

              <h3>{asset.title}</h3>

              <p>Type: {asset.type}</p>

              <p>Status: {asset.status}</p>

              <p>
                Deadman Status: {statusMap[asset._id] || "Loading..."}
              </p>


              {asset.status === "LOCKED" &&
               statusMap[asset._id] === "CLAIM_ALLOWED" && (

                <button
                  className="claim-btn"
                  onClick={() => claimAsset(asset._id)}
                >
                  Claim Asset
                </button>

              )}


              {asset.status === "RELEASED" && (

                <p className="released">
                  Asset Released
                </p>

              )}

            </div>

          ))}

        </div>

      </main>

    </div>

  );

};

export default Dashboard;
