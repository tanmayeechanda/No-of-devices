import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import QRCode from "qrcode.react";
import "./Dashboard.css";

const NormalAdminDashboard = () => {
  const [numberOfDevices, setNumberOfDevices] = useState("");
  const [generatedDevices, setGeneratedDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  const handleGenerateDevices = async (e) => {
    e.preventDefault();

    if (!numberOfDevices || numberOfDevices < 1) {
      alert("Please enter a valid number");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/devices/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ numberOfDevices: parseInt(numberOfDevices) }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGeneratedDevices(data.devices);
        setNumberOfDevices("");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error generating devices:", error);
      alert("Failed to generate devices");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🧑‍💼Admin Dashboard</h1>
          <div className="user-info">
            <span>{user.username}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="device-generator">
          <h2>Generate Devices</h2>
          <form onSubmit={handleGenerateDevices} className="generator-form">
            <div className="form-group">
              <label htmlFor="numberOfDevices">Number of Devices</label>
              <input
                type="number"
                id="numberOfDevices"
                value={numberOfDevices}
                onChange={(e) => setNumberOfDevices(e.target.value)}
                min="1"
                max="50"
                placeholder="Enter number (1-50)"
                required
              />
            </div>
            <button type="submit" className="generate-btn" disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </button>
          </form>
        </div>

        {generatedDevices.length > 0 && (
          <div className="generated-devices">
            <h2>Generated Devices ({generatedDevices.length})</h2>
            <div className="devices-grid">
              {generatedDevices.map((device, index) => (
                <div key={device._id} className="device-card">
                  <div className="device-header">
                    <h3>{device.name}</h3>
                    <span className="device-number">#{index + 1}</span>
                  </div>

                  <div className="device-code">
                    <label>Code:</label>
                    <code>{device.code}</code>
                  </div>

                  <div className="qr-code-section">
                    <label>QR Code:</label>
                    <div className="qr-code-container">
                      <QRCode
                        value={device.code}
                        size={100}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div className="device-info">
                    <small>
                      Created: {new Date(device.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NormalAdminDashboard;
