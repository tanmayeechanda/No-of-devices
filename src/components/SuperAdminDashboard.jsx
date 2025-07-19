import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("admins");
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [adminsRes, devicesRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/admins", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/devices", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdmins(adminsData);
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm("Delete this device?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/devices/${deviceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setDevices(devices.filter((device) => device._id !== deviceId));
      }
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🕵️‍♂️ Super Admin</h1>
          <div className="user-info">
            <span>{user.username}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{admins.length}</h3>
              <p>Admins</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-info">
              <h3>{devices.length}</h3>
              <p>Devices</p>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "admins" ? "active" : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            Admins
          </button>
          <button
            className={`tab ${activeTab === "devices" ? "active" : ""}`}
            onClick={() => setActiveTab("devices")}
          >
            Devices
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "admins" && (
            <div className="data-table">
              <h2>All Admins</h2>
              {admins.length === 0 ? (
                <p className="no-data">No admins found</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin._id}>
                        <td>{admin.username}</td>
                        <td>{admin.email}</td>
                        <td>
                          <span className={`role-badge ${admin.role}`}>
                            {admin.role === "superadmin"
                              ? "Super Admin"
                              : "Admin"}
                          </span>
                        </td>
                        <td>
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "devices" && (
            <div className="data-table">
              <h2>All Devices</h2>
              {devices.length === 0 ? (
                <p className="no-data">No devices found</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Device Name</th>
                      <th>Code</th>
                      <th>Created By</th>
                      <th>Created</th>
                      <th>Assigned</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device._id}>
                        <td>{device.name}</td>
                        <td>
                          <code>{device.code}</code>
                        </td>
                        <td>{device.createdBy?.username || "Unknown"}</td>
                        <td>
                          {new Date(device.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          {device.assignedTo ? (
                            <span
                              style={{ color: "green", fontWeight: "bold" }}
                            >
                              Yes
                            </span>
                          ) : (
                            <span style={{ color: "red", fontWeight: "bold" }}>
                              No
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteDevice(device._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
