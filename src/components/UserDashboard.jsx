import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import axios from "axios";
import "./Dashboard.css";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [device, setDevice] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  const fetchAssignedDevice = async () => {
    try {
      const res = await axios.get("/api/devices/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDevice(res.data.device);
    } catch (err) {
      console.log("No device assigned yet.");
    }
  };

  useEffect(() => {
    fetchAssignedDevice();
  }, []);

  const handleScan = async (result) => {
    if (!result) return;
    setScanning(false);

    try {
      const res = await axios.post(
        "/api/devices/assign",
        { code: result },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setDevice(res.data.device);
      setMessage("QR code successfully assigned!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to assign QR code");
    }
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
          <div className="device-info">
            <h2>Your Device</h2>
            <img src={device.qrCode} alt="Assigned QR" width="200" />
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
          </div>
        ) : (
          <>
            <button className="scan-btn" onClick={() => setScanning(true)}>
              Scan a QR Code
            </button>
            {scanning && (
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={(result) => handleScan(result?.text)}
                containerStyle={{ width: "300px", marginTop: "1rem" }}
              />
            )}
            {message && <p className="scan-message">{message}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
