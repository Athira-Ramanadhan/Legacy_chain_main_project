import { Link } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Top Bar */}
      <header className="dash-header">
        <h2>LegacyChain</h2>
        <div className="user-info">
          <span>Status: Connected</span>
          <button className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main">
        <h1>Dashboard</h1>
        <p className="subtitle">
          Overview of your digital wills and asset status
        </p>

        {/* Stats Cards */}
        <div className="stats">
          <div className="card">
            <h3>Total Wills</h3>
            <p>1</p>
          </div>

          <div className="card">
            <h3>Active Will</h3>
            <p>Draft</p>
          </div>

          <div className="card">
            <h3>Beneficiaries</h3>
            <p>3</p>
          </div>

          <div className="card">
            <h3>Blockchain Status</h3>
            <p>Not Deployed</p>
          </div>
        </div>

        {/* Primary Action */}
        <div className="actions">
          <Link to="/create-will" className="primary-action">
            Create New Digital Will
          </Link>
        </div>

        {/* Recent Activity */}
        <section className="activity">
          <h2>Recent Activity</h2>
          <ul>
            <li>Digital will created (Draft)</li>
            <li>Beneficiary added</li>
            <li>Assets listed</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
