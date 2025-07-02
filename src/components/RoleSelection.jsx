import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./RoleSelection.css";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    {
      id: "superadmin",
      title: "Super Admin",
      icon: "🕵️‍♂️",
      description: "Manage all admins and devices",
    },
    {
      id: "normaladmin",
      title: "Admin",
      icon: "🧑‍💼",
      description: "Generate and manage devices",
    },
    {
      id: "user",
      title: "User",
      icon: "👤",
      description: "Access your user dashboard.",
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-selection-page">
      <div className="role-container">
        <div className="role-header">
          <Link to="/" className="back-link">
            ← Back
          </Link>
          <h1>{step === 1 ? "Choose Your Role" : "Create Account"}</h1>
        </div>

        {step === 1 ? (
          <div className="roles-grid">
            {roles.map((role) => (
              <div
                key={role.id}
                className="role-card"
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="role-icon">{role.icon}</div>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <button className="select-btn">Select</button>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="registration-form">
            {error && <div className="error-message">{error}</div>}

            <div className="selected-role">
              <span>{roles.find((r) => r.id === selectedRole)?.icon}</span>
              <span>{roles.find((r) => r.id === selectedRole)?.title}</span>
              <button type="button" onClick={() => setStep(1)}>
                Change
              </button>
            </div>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Username"
              required
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
            />

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              minLength="6"
            />

            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="role-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
