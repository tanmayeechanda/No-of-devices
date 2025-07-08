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
  const [loading, setLoading] = useState(false);

  const fetchAssignedDevices = async () => {
    try {
      const res = await axios.get("/api/devices/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.devices) {
        setDevices(res.data.devices);
      }
    } catch (err) {
      console.log("Error fetching devices:", err.message);
      setDevices([]);
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
    // Prevent assigning the same code twice
    if (devices.some((d) => d.code === code)) {
      setMessage("⚠️ Device already assigned.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const location = await getLocation();
      const timestamp = new Date().toISOString();
      let address = null;

      if (location) {
        try {
          const geoRes = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${
              location.latitude
            }+${location.longitude}&key=${
              import.meta.env.VITE_OPENCAGE_API_KEY
            }`
          );
          address = geoRes.data.results[0]?.formatted;
        } catch (geoErr) {
          console.warn("Reverse geocoding failed:", geoErr.message);
        }
      }

      const res = await axios.post(
        "/api/devices/assign",
        { code, scannedAt: timestamp, location, address },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (res.data.device) {
        setDevices((prev) => [...prev, res.data.device]);
        setMessage("✅ QR code successfully assigned!");
        setManualCode("");
      }
    } catch (err) {
      console.error("Assignment error:", err.response || err.message || err);
      setMessage(err.response?.data?.message || "❌ Failed to assign QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (data) => {
    if (data?.text && !loading) {
      setScanning(false);
      assignDevice(data.text.trim());
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result?.trim();
      if (result) assignDevice(result);
      else setMessage("❌ File is empty or unreadable");
    };
    reader.onerror = () => {
      setMessage("❌ Failed to read the file");
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      assignDevice(manualCode.trim());
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>User Dashboard</h1>
          <div className="user-info">
            <span>{user?.username}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="welcome-section">
        <div className="welcome-card">
          <p>
            Welcome <strong>{user?.username}</strong> to Addwise Tech’s
            role-based device generation system
          </p>
        </div>
      </div>

      <div className="dashboard-cards three-columns">
        <div className="dashboard-card">
          <button
            className="scan-btn"
            onClick={() => setScanning(true)}
            disabled={scanning || loading}
          >
            Scan QR
          </button>
          {scanning && (
            <div
              style={{ marginTop: "1rem", width: "100%", maxWidth: "300px" }}
            >
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
        </div>

        <div className="dashboard-card">
          <label htmlFor="fileUpload" className="scan-btn">
            Choose File
          </label>
          <input
            id="fileUpload"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            disabled={loading}
          />
        </div>

        <div className="dashboard-card">
          <input
            type="text"
            className="form-group-input"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter the 16-digit code"
            style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
            disabled={loading}
          />
          <button
            onClick={handleManualSubmit}
            className="scan-btn"
            disabled={loading}
          >
            Assign by code
          </button>
        </div>
      </div>

      {loading && <p className="scan-message">⏳ Assigning device...</p>}
      {message && <p className="scan-message">{message}</p>}

      {devices.length > 0 && (
        <div className="device-list">
          {devices.map((device, idx) => (
            <div
              key={device._id || idx}
              className="dashboard-cards three-columns"
            >
              <div className="dashboard-card">
                <h3 className="card-title">QR Code</h3>
                <img src={device.qrCode} alt="QR" className="qr-full" />
              </div>

              <div className="dashboard-card">
                <h3 className="card-title">Device Details</h3>
                <p>
                  <strong>Code:</strong> {device.code}
                </p>
                <p>
                  <strong>Name:</strong> {device.name}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Assigned At:</strong>{" "}
                  {new Date(device.assignedAt).toLocaleString()}
                </p>
                <p>
                  <strong>📍 Address:</strong>{" "}
                  {device.address || "Not available"}
                </p>
              </div>

              <div className="dashboard-card">
                <h3 className="card-title">Map</h3>
                {device.location?.latitude && device.location?.longitude ? (
                  <iframe
                    title="Device Location"
                    src={`https://www.google.com/maps?q=${device.location.latitude},${device.location.longitude}&z=15&output=embed`}
                    width="100%"
                    height="250"
                    style={{ border: "none", borderRadius: "8px" }}
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                ) : (
                  <p>No location available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
