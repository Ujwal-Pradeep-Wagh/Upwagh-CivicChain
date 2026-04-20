/**
 * LoginPage.jsx — Login & Register
 *
 * This page has two tabs: Login and Register.
 * On success it stores the JWT token + user info in localStorage,
 * then redirects to the correct page based on role:
 *   citizen → /citizen
 *   officer → /officer
 *   admin   → /admin
 */

import React, { useState } from "react";
import { useNavigate }     from "react-router-dom";

const API = "http://localhost:5000/api/auth";

// Shared input style used throughout this page
const inputStyle = {
  width         : "100%",
  padding       : "10px 12px",
  marginBottom  : "14px",
  borderRadius  : "6px",
  border        : "1px solid #ccc",
  fontSize      : "15px",
  boxSizing     : "border-box",
};

const buttonStyle = {
  width          : "100%",
  padding        : "12px",
  backgroundColor: "#2c3e50",
  color          : "#fff",
  border         : "none",
  borderRadius   : "6px",
  fontSize       : "16px",
  cursor         : "pointer",
};

export default function LoginPage() {
  const navigate = useNavigate();

  // Toggle between "login" and "register" tabs
  const [tab, setTab]     = useState("login");
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register form state
  const [regData, setRegData] = useState({
    name         : "",
    email        : "",
    password     : "",
    role         : "citizen",
    walletAddress: "",
  });

  // ── LOGIN HANDLER ──────────────────────────

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/login`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(loginData),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg("❌ " + data.message);
        setLoading(false);
        return;
      }

      // Save token and user info to localStorage
      localStorage.setItem("civicchain_token", data.token);
      localStorage.setItem("civicchain_user",  JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "citizen") navigate("/citizen");
      else if (data.user.role === "officer") navigate("/officer");
      else if (data.user.role === "admin")   navigate("/admin");
    } catch (err) {
      setMsg("❌ Could not connect to backend. Is the server running?");
    }

    setLoading(false);
  }

  // ── REGISTER HANDLER ──────────────────────

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/register`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(regData),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg("❌ " + data.message);
        setLoading(false);
        return;
      }

      // Auto-login after registration
      localStorage.setItem("civicchain_token", data.token);
      localStorage.setItem("civicchain_user",  JSON.stringify(data.user));

      if (data.user.role === "citizen") navigate("/citizen");
      else if (data.user.role === "officer") navigate("/officer");
      else if (data.user.role === "admin")   navigate("/admin");
    } catch (err) {
      setMsg("❌ Could not connect to backend. Is the server running?");
    }

    setLoading(false);
  }

  // ── RENDER ────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ecf0f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "10px", padding: "36px", width: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>

        {/* Header */}
        <h1 style={{ textAlign: "center", color: "#2c3e50", marginBottom: "4px" }}>⛓ CivicChain</h1>
        <p style={{ textAlign: "center", color: "#7f8c8d", marginBottom: "24px", fontSize: "14px" }}>
          Transparent Public Grievance System
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "24px", borderBottom: "2px solid #ecf0f1" }}>
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(""); }}
              style={{
                flex           : 1,
                padding        : "10px",
                border         : "none",
                backgroundColor: "transparent",
                borderBottom   : tab === t ? "3px solid #2c3e50" : "3px solid transparent",
                fontWeight     : tab === t ? "bold" : "normal",
                cursor         : "pointer",
                fontSize       : "15px",
                color          : tab === t ? "#2c3e50" : "#7f8c8d",
                textTransform  : "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Error / Success message */}
        {msg && (
          <div style={{ padding: "10px", backgroundColor: "#fdecea", borderRadius: "6px", marginBottom: "14px", color: "#c0392b", fontSize: "14px" }}>
            {msg}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <label style={{ fontSize: "13px", color: "#555" }}>Email</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="your@email.com"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Password</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
            />

            <button style={buttonStyle} type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <label style={{ fontSize: "13px", color: "#555" }}>Full Name</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="John Doe"
              value={regData.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Email</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="your@email.com"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Password</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="Min. 6 characters"
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Role</label>
            <select
              style={{ ...inputStyle }}
              value={regData.role}
              onChange={(e) => setRegData({ ...regData, role: e.target.value })}
            >
              <option value="citizen">Citizen</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin / Auditor</option>
            </select>

            <label style={{ fontSize: "13px", color: "#555" }}>
              MetaMask Wallet Address <span style={{ color: "#7f8c8d" }}>(required for Officer/Admin)</span>
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0x..."
              value={regData.walletAddress}
              onChange={(e) => setRegData({ ...regData, walletAddress: e.target.value })}
            />

            <button style={buttonStyle} type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}