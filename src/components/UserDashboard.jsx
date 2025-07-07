import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import "./Dashboard.css";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [device, setDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [askToScan, setAskToScan] = useState(false);

  const fetchAssignedDevice = async () => {
    try {
      const res = await axios.get("/api/devices/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDevice(res.data.device);
    } catch (err) {
      console.log("No device assigned yet.", err.message);
    }
  };

  useEffect(() => {
    fetchAssignedDevice();
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
        (err) => {
          console.warn("Geolocation failed:", err);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleScan = async (data) => {
    if (!data) return;
    setScanning(false);

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
          code: data.text || data,
          scannedAt: timestamp,
          location,
          address,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setDevice(res.data.device);
      setMessage("✅ QR code successfully assigned!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "❌ Failed to assign QR code");
    }
  };

  const handleError = (err) => {
    console.error("QR Scan error:", err);
    setMessage("❌ Error accessing camera or scanning QR");
    setScanning(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👤 User Dashboard</h1>
          <div className="user-info">
            <span>{user.username}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {device ? (
          <div className="dashboard-cards three-columns">
            <div className="dashboard-card light-card">
              <h3 className="card-title">QR Code</h3>
              <div className="qr-container">
                <img
                  src={device.qrCode}
                  alt="Assigned QR"
                  className="qr-full"
                />
              </div>
            </div>

            <div className="dashboard-card light-card">
              <h3 className="card-title">Device Info</h3>
              <p>
                <strong>Device Code:</strong> {device.code}
              </p>
              <p>
                <strong>Device Name:</strong> {device.name}
              </p>
              <p>
                <strong>Assigned To:</strong> {user.username}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              {device.location?.latitude && device.location?.longitude && (
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
            </div>

            {device.location && (
              <div className="dashboard-card light-card">
                <h3 className="card-title">Map</h3>
                <iframe
                  title="Device Location Map"
                  src={`https://www.google.com/maps?q=${device.location.latitude},${device.location.longitude}&z=15&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: "none", borderRadius: "8px" }}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
            )}
          </div>
        ) : askToScan ? (
          <>
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
                  onError={handleError}
                  onScan={handleScan}
                />
              </div>
            )}

            {message && <p className="scan-message">{message}</p>}
          </>
        ) : (
          <button className="scan-btn" onClick={() => setAskToScan(true)}>
            Do you want to scan a QR code?
          </button>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
