/**
 * AdminPage.jsx — Admin / Auditor Dashboard
 *
 * Admin can:
 *  1. View ALL grievances stored on the blockchain
 *  2. Filter by status (Pending / InProgress / Resolved)
 *  3. Read-only — no write access to the blockchain
 *
 * Uses the backend API which internally calls getAllGrievances() via Web3.js.
 */

import React, { useState, useEffect } from "react";
import { useNavigate }                  from "react-router-dom";
import { statusColor }                  from "../utils/web3";

const API   = "http://localhost:5000/api";
const token = () => localStorage.getItem("civicchain_token");
const user  = () => JSON.parse(localStorage.getItem("civicchain_user"));

const cardStyle = {
  background   : "#fff",
  borderRadius : "10px",
  padding      : "20px",
  marginBottom : "14px",
  boxShadow    : "0 2px 8px rgba(0,0,0,0.07)",
};

const btnStyle = {
  padding        : "8px 18px",
  backgroundColor: "#2c3e50",
  color          : "#fff",
  border         : "none",
  borderRadius   : "6px",
  fontSize       : "14px",
  cursor         : "pointer",
};

export default function AdminPage() {
  const navigate = useNavigate();

  const [grievances, setGrievances] = useState([]);
  const [filter,     setFilter]     = useState("All");   // Status filter
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  // ── LOAD ALL GRIEVANCES ────────────────────

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const res  = await fetch(`${API}/grievances/all`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError("❌ " + data.message);
      } else {
        setGrievances(data.grievances || []);
      }
    } catch (err) {
      setError("❌ Could not connect to backend.");
    }

    setLoading(false);
  }

  // Load on page mount
  useEffect(() => { loadAll(); }, []);

  // ── FILTER ────────────────────────────────

  const filtered = filter === "All"
    ? grievances
    : grievances.filter((g) => g.status === filter);

  // ── STATS ─────────────────────────────────

  const total      = grievances.length;
  const pending    = grievances.filter((g) => g.status === "Pending").length;
  const inProgress = grievances.filter((g) => g.status === "InProgress").length;
  const resolved   = grievances.filter((g) => g.status === "Resolved").length;

  // ── LOGOUT ────────────────────────────────

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  // ── RENDER ────────────────────────────────

  const currentUser = user();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ecf0f1", padding: "30px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, color: "#2c3e50" }}>⛓ CivicChain — Admin Panel</h2>
            <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>
              {currentUser?.name} | Read-only blockchain audit view
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadAll} style={{ ...btnStyle, backgroundColor: "#27ae60" }}>
              🔄 Refresh
            </button>
            <button onClick={logout} style={{ ...btnStyle, backgroundColor: "#e74c3c" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { label: "Total",       value: total,      color: "#2c3e50" },
            { label: "Pending",     value: pending,    color: "#e67e22" },
            { label: "In Progress", value: inProgress, color: "#2980b9" },
            { label: "Resolved",    value: resolved,   color: "#27ae60" },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1, minWidth: "120px", background: "#fff",
              borderRadius: "10px", padding: "18px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              borderTop: `4px solid ${s.color}`,
            }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#7f8c8d" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {["All", "Pending", "InProgress", "Resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...btnStyle,
                backgroundColor: filter === f ? "#2c3e50" : "#bdc3c7",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "12px", backgroundColor: "#fdecea", borderRadius: "8px", color: "#c0392b", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <p style={{ color: "#7f8c8d" }}>Fetching grievances from blockchain...</p>}

        {/* Empty */}
        {!loading && filtered.length === 0 && !error && (
          <div style={cardStyle}>
            <p style={{ margin: 0, color: "#7f8c8d" }}>No grievances found for filter: {filter}</p>
          </div>
        )}

        {/* Grievance Table */}
        {filtered.map((g) => (
          <div key={g.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "16px" }}>
                    #{g.id} — {g.title}
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "12px",
                    backgroundColor: statusColor(g.status), color: "#fff", fontWeight: "bold",
                  }}>
                    {g.status}
                  </span>
                </div>

                <p style={{ margin: "0 0 6px", color: "#555", fontSize: "14px" }}>{g.description}</p>

                <div style={{ fontSize: "13px", color: "#7f8c8d", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <span>📍 {g.location}</span>
                  <span>🏷 {g.category}</span>
                  <span>🕐 {g.timestamp}</span>
                </div>

                <div style={{ fontSize: "12px", color: "#95a5a6", marginTop: "8px" }}>
                  <div>👤 Citizen: <code>{g.citizen}</code></div>
                  <div>🏛 Officer: <code>{g.assignedOfficer}</code></div>
                </div>

                {g.remarks && (
                  <p style={{ margin: "8px 0 0", color: "#2980b9", fontSize: "13px" }}>
                    💬 Officer Remarks: {g.remarks}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}