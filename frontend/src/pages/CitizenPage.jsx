/**
 * CitizenPage.jsx — Citizen Dashboard
 *
 * TWO SECTIONS:
 *  1. Submit a new grievance — calls the backend → backend calls smart contract via Web3.js
 *  2. Track status of a grievance by ID — calls backend → backend reads from blockchain
 *
 * Web3.js is also imported here directly so the citizen can optionally
 * read their grievance directly from the blockchain (demonstrating frontend Web3 usage).
 */

import React, { useState, useEffect } from "react";
import { useNavigate }                 from "react-router-dom";
import { connectWallet, mapStatus, statusColor } from "../utils/web3";

const API   = "http://localhost:5000/api";
const token = () => localStorage.getItem("civicchain_token");
const user  = () => JSON.parse(localStorage.getItem("civicchain_user"));

const cardStyle = {
  background   : "#fff",
  borderRadius : "10px",
  padding      : "28px",
  marginBottom : "24px",
  boxShadow    : "0 2px 10px rgba(0,0,0,0.08)",
};

const inputStyle = {
  width        : "100%",
  padding      : "10px 12px",
  marginBottom : "14px",
  borderRadius : "6px",
  border       : "1px solid #ccc",
  fontSize     : "15px",
  boxSizing    : "border-box",
};

const btnStyle = {
  padding        : "10px 24px",
  backgroundColor: "#2c3e50",
  color          : "#fff",
  border         : "none",
  borderRadius   : "6px",
  fontSize       : "15px",
  cursor         : "pointer",
};

export default function CitizenPage() {
  const navigate = useNavigate();

  // ── STATE ──────────────────────────────────

  const [officers,   setOfficers]   = useState([]);   // List of officers for dropdown
  const [form,       setForm]       = useState({
    title: "", description: "", location: "", category: "Roads", officerWallet: "",
  });
  const [submitMsg,  setSubmitMsg]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [trackId,    setTrackId]    = useState("");   // Grievance ID to track
  const [trackData,  setTrackData]  = useState(null); // Result from blockchain
  const [tracking,   setTracking]   = useState(false);

  // Web3 state — for direct blockchain read from browser
  const [walletAccount, setWalletAccount] = useState("");

  // ── LOAD OFFICERS ON MOUNT ─────────────────

  useEffect(() => {
    // Fetch all registered officers from MongoDB (for the dropdown)
    fetch(`${API}/auth/officers`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => setOfficers(data.officers || []))
      .catch(() => setOfficers([]));
  }, []);

  // ── LOGOUT ────────────────────────────────

  function logout() {
    localStorage.removeItem("civicchain_token");
    localStorage.removeItem("civicchain_user");
    navigate("/login");
  }

  // ── CONNECT METAMASK (optional for citizen) ─

  async function connectMeta() {
    try {
      const { account } = await connectWallet();
      setWalletAccount(account);
      alert("MetaMask connected: " + account);
    } catch (err) {
      alert("MetaMask error: " + err.message);
    }
  }

  // ── SUBMIT GRIEVANCE ──────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitMsg("");
    setSubmitting(true);

    try {
      const res  = await fetch(`${API}/grievances/submit`, {
        method : "POST",
        headers: {
          "Content-Type" : "application/json",
          Authorization  : `Bearer ${token()}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitMsg("❌ " + data.message);
      } else {
        setSubmitMsg(
          `✅ Grievance submitted! Transaction Hash: ${data.transactionHash}`
        );
        // Reset form
        setForm({ title: "", description: "", location: "", category: "Roads", officerWallet: "" });
      }
    } catch (err) {
      setSubmitMsg("❌ Could not reach the backend.");
    }

    setSubmitting(false);
  }

  // ── TRACK GRIEVANCE STATUS ─────────────────

  async function handleTrack(e) {
    e.preventDefault();
    setTrackData(null);
    setTracking(true);

    try {
      const res  = await fetch(`${API}/grievances/${trackId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();

      if (!res.ok) {
        alert("❌ " + data.message);
      } else {
        setTrackData(data.grievance);
      }
    } catch (err) {
      alert("❌ Could not reach the backend.");
    }

    setTracking(false);
  }

  // ── RENDER ────────────────────────────────

  const currentUser = user();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ecf0f1", padding: "30px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, color: "#2c3e50" }}>⛓ CivicChain</h2>
            <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>
              Welcome, {currentUser?.name} (Citizen)
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={connectMeta} style={{ ...btnStyle, backgroundColor: "#e67e22" }}>
              {walletAccount ? "🦊 " + walletAccount.slice(0, 8) + "..." : "🦊 Connect MetaMask"}
            </button>
            <button onClick={logout} style={{ ...btnStyle, backgroundColor: "#e74c3c" }}>
              Logout
            </button>
          </div>
        </div>

        {/* ─── SECTION 1: SUBMIT GRIEVANCE ─── */}
        <div style={cardStyle}>
          <h3 style={{ color: "#2c3e50", marginTop: 0 }}>📝 Submit a Grievance</h3>
          <p style={{ color: "#7f8c8d", fontSize: "13px" }}>
            Your complaint will be stored permanently on the Ethereum blockchain via Web3.js.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: "13px", color: "#555" }}>Title</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Pothole on Main Street"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Description</label>
            <textarea
              style={{ ...inputStyle, height: "90px", resize: "vertical" }}
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Location / Area</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Ward 5, Koregaon Park"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />

            <label style={{ fontSize: "13px", color: "#555" }}>Category</label>
            <select
              style={inputStyle}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Roads</option>
              <option>Water</option>
              <option>Electricity</option>
              <option>Sanitation</option>
              <option>Other</option>
            </select>

            <label style={{ fontSize: "13px", color: "#555" }}>Assign to Officer</label>
            <select
              style={inputStyle}
              value={form.officerWallet}
              onChange={(e) => setForm({ ...form, officerWallet: e.target.value })}
              required
            >
              <option value="">-- Select an Officer --</option>
              {officers.map((o) => (
                <option key={o._id} value={o.walletAddress}>
                  {o.name} ({o.walletAddress.slice(0, 10)}...)
                </option>
              ))}
            </select>

            {submitMsg && (
              <div style={{
                padding: "10px", borderRadius: "6px", marginBottom: "14px",
                backgroundColor: submitMsg.startsWith("✅") ? "#eafaf1" : "#fdecea",
                color: submitMsg.startsWith("✅") ? "#1e8449" : "#c0392b",
                fontSize: "13px", wordBreak: "break-all",
              }}>
                {submitMsg}
              </div>
            )}

            <button type="submit" style={btnStyle} disabled={submitting}>
              {submitting ? "Submitting to Blockchain..." : "Submit Grievance"}
            </button>
          </form>
        </div>

        {/* ─── SECTION 2: TRACK GRIEVANCE ─── */}
        <div style={cardStyle}>
          <h3 style={{ color: "#2c3e50", marginTop: 0 }}>🔍 Track Grievance Status</h3>
          <p style={{ color: "#7f8c8d", fontSize: "13px" }}>
            Enter a grievance ID to read its current status directly from the blockchain.
          </p>

          <form onSubmit={handleTrack} style={{ display: "flex", gap: "10px" }}>
            <input
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              type="number"
              min="1"
              placeholder="Enter Grievance ID (e.g. 1)"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              required
            />
            <button type="submit" style={btnStyle} disabled={tracking}>
              {tracking ? "Fetching..." : "Track"}
            </button>
          </form>

          {/* Grievance details card */}
          {trackData && (
            <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, color: "#2c3e50" }}>#{trackData.id} — {trackData.title}</h4>
                <span style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "13px",
                  backgroundColor: statusColor(trackData.status),
                  color: "#fff", fontWeight: "bold",
                }}>
                  {trackData.status}
                </span>
              </div>
              <p style={{ margin: "8px 0 4px", color: "#555", fontSize: "14px" }}>{trackData.description}</p>
              <p style={{ margin: "4px 0", color: "#7f8c8d", fontSize: "13px" }}>📍 {trackData.location} &nbsp;|&nbsp; 🏷 {trackData.category}</p>
              <p style={{ margin: "4px 0", color: "#7f8c8d", fontSize: "13px" }}>🕐 Submitted: {trackData.timestamp}</p>
              {trackData.remarks && (
                <p style={{ margin: "8px 0 0", color: "#2980b9", fontSize: "13px" }}>
                  💬 Officer Remarks: {trackData.remarks}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}