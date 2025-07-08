import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import "./Dashboard.css";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [manualCode, setManualCode] = useState("");

  const fetchAssignedDevices = async () => {
    try {
      const res = await axios.get("/api/devices/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDevices(res.data.devices || [res.data.device]);
    } catch (err) {
      console.error("No devices assigned yet.", err.message);
    }
  };

  useEffect(() => {
    fetchAssignedDevices();
  }, []);

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const assignDevice = async (code) => {
    try {
      const location = await getLocation();
      const timestamp = new Date().toISOString();
      let address = null;

      if (location) {
        const geoRes = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${
            location.latitude
          }+${location.longitude}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}`
        );
        address = geoRes.data.results[0]?.formatted;
      }

      const res = await axios.post(
        "/api/devices/assign",
        {
          code,
          scannedAt: timestamp,
          location,
          address,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setDevices((prev) => [...prev, res.data.device]);
      setMessage("✅ QR code successfully assigned!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "❌ Failed to assign QR code");
    }
  };

  const handleScan = (data) => {
    if (data) {
      setScanning(false);
      assignDevice(data.text || data);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      assignDevice(reader.result.trim());
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) assignDevice(manualCode.trim());
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>UserDashboard</h1>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="welcome-section">
        <div className="welcome-card">
          <p>
            Welcome <strong>{user.username}</strong> to addwise tech's role
            based device generation system
          </p>
        </div>
      </div>

      <div className="button-row">
        <button onClick={() => setScanning(true)}>Scan QR</button>
        <label>
          <input type="file" accept=".txt" onChange={handleFileUpload} />
        </label>
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Enter the 16-digit code"
        />
        <button onClick={handleManualSubmit}>Assign by code</button>
      </div>

      {scanning && (
        <div className="qr-scan-area">
          <QrScanner
            delay={300}
            style={{ width: "100%" }}
            onError={(err) => {
              console.error("QR Scan error:", err);
              setScanning(false);
            }}
            onScan={handleScan}
          />
        </div>
      )}

      {message && <p className="scan-message">{message}</p>}

      <div className="dashboard-cards three-columns">
        <div className="dashboard-card">QR code</div>
        <div className="dashboard-card">User details</div>
        <div className="dashboard-card">Map</div>
      </div>

      {devices.length > 0 && (
        <div style={{ width: "100%", marginTop: "2rem" }}>
          <iframe
            title="Assigned Devices Map"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: "10px" }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/view?key=${
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY
            }&center=${devices[0].location.latitude},${
              devices[0].location.longitude
            }&zoom=4&maptype=roadmap`}
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
