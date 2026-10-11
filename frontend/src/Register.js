import { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "./Register.css";

function Register({ setPage }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      alert("Registration successful");
      setPage("login");
    } else {
      alert("Registration failed");
    }
  };

  return (
    <div className="register-container">
      <button className="back-home-btn" onClick={() => setPage("home")}>
        <FaArrowLeft /> Back to Home
      </button>

      <div className="register-card">
        <div className="register-header">
          <h2 className="register-title">Create Account</h2>
          <p className="register-subtitle">Join HideIT-X and start securing your files</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="input-group">
            <input
              className="register-input"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <span className="input-icon"><FaUser /></span>
          </div>

          <div className="input-group">
            <input
              className="register-input"
              type="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <span className="input-icon"><FaEnvelope /></span>
          </div>

          <div className="input-group">
            <input
              className="register-input"
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="input-icon"><FaLock /></span>
          </div>

          <button type="submit" className="register-button">
            <span className="button-text">Register Account</span>
            <FaArrowRight className="button-icon" />
          </button>
        </form>

        <div className="register-footer">
          <p
            onClick={() => setPage("login")}
            className="back-to-login"
          >
            Already have an account? <span className="login-link">Sign In</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;