import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const CreateAsset = () => {

  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("DOCUMENT");
  const [nomineeId, setNomineeId] = useState("");
  const [data, setData] = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(
        "http://localhost:5000/assets/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            type,
            nomineeId,
            data
          })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Error creating asset");
        return;
      }

      alert("Asset created successfully");

      navigate("/dashboard");

    } catch (err) {

      console.error(err);

      alert("Server error");

    }

  };

  return (
    <div className="dashboard">

      <header className="dash-header">
        <h2>Create Asset</h2>
      </header>

      <main className="dash-main">

        <form onSubmit={handleSubmit} className="card">

          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
          />

          <label>Type</label>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
          >
            <option value="DOCUMENT">
              DOCUMENT
            </option>

            <option value="PASSWORD">
              PASSWORD
            </option>

            <option value="FINANCIAL">
              FINANCIAL
            </option>

            <option value="PROPERTY">
              PROPERTY
            </option>

            <option value="MESSAGE">
              MESSAGE
            </option>
          </select>

          <label>Nominee User ID</label>
          <input
            type="text"
            value={nomineeId}
            onChange={(e) =>
              setNomineeId(e.target.value)
            }
            required
          />

          <label>Asset Data</label>
          <textarea
            value={data}
            onChange={(e) =>
              setData(e.target.value)
            }
            required
          />

          <button
            type="submit"
            className="primary-action"
          >
            Create Asset
          </button>

        </form>

      </main>

    </div>
  );
};

export default CreateAsset;
