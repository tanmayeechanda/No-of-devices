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
      const deviceArray = Array.isArray(res.data.device)
        ? res.data.device
        : [res.data.device];
      setDevices(deviceArray);
    } catch (err) {
      console.log("No devices assigned yet.", err.message);
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

  const handleFileUpload = async (e) => {
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
    <div className="hboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👤 User Dashboard</h1>
          <div className="user-info">
            <span>{user?.username}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3 className="card-title">Assign Device</h3>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter 16-digit code manually"
          />
          <button onClick={handleManualSubmit}>Assign by Code</button>

          <input type="file" accept=".txt" onChange={handleFileUpload} />

          <button
            className="scan-btn"
            onClick={() => setScanning(true)}
            disabled={scanning}
          >
            Start QR Scan
          </button>

          {scanning && (
            <div
              style={{ marginTop: "1rem", width: "100%", maxWidth: "400px" }}
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

          {message && <p className="scan-message">{message}</p>}
        </div>

        <div className="dashboard-cards">
          {devices.map((device, index) => (
            <div key={device.code || index} className="dashboard-card">
              <h3 className="card-title">Device Info</h3>
              <p>
                <strong>Device Code:</strong> {device.code}
              </p>
              <p>
                <strong>Device Name:</strong> {device.name}
              </p>
              <p>
                <strong>Assigned To:</strong> {user?.username}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              {device.location?.latitude && (
                <p>
                  <strong>Scanned Location:</strong> Lat{" "}
                  {device.location.latitude}, Lng {device.location.longitude}
                </p>
              )}
              {device.assignedAt && (
                <p>
                  <strong>Scanned At:</strong>{" "}
                  {new Date(device.assignedAt).toLocaleString()}
                </p>
              )}
              {device.address && (
                <p>
                  <strong>📍 Address:</strong> {device.address}
                </p>
              )}
              {device.location?.latitude && (
                <iframe
                  title="Device Location Map"
                  src={`https://www.google.com/maps?q=${device.location.latitude},${device.location.longitude}&z=15&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: "none", borderRadius: "8px" }}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
