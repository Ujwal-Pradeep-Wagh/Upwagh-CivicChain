/**
 * OfficerPage.jsx — Officer Dashboard
 *
 * Officers can:
 *  1. Connect MetaMask (required to sign blockchain transactions)
 *  2. View all grievances assigned to their wallet address
 *  3. Update the status of a grievance (signs with MetaMask → Web3.js → Smart Contract)
 *
 * The status update uses MetaMask signing via Web3.js directly from the browser.
 * The contract's updateStatus() requires msg.sender === assignedOfficer, so
 * the transaction MUST be sent from the officer's MetaMask account.
 */

import React, { useState, useEffect } from "react";
import { useNavigate }                  from "react-router-dom";
import { connectWallet, mapStatus, statusColor } from "../utils/web3";

const API   = "http://localhost:5000/api";
const token = () => localStorage.getItem("civicchain_token");
const user  = () => JSON.parse(localStorage.getItem("civicchain_user"));

const cardStyle = {
  background   : "#fff",
  borderRadius : "10px",
  padding      : "24px",
  marginBottom : "16px",
  boxShadow    : "0 2px 10px rgba(0,0,0,0.08)",
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

export default function OfficerPage() {
  const navigate = useNavigate();

  // ── STATE ──────────────────────────────────

  const [walletAccount, setWalletAccount] = useState("");
  const [web3Instance,  setWeb3Instance]  = useState(null);
  const [contract,      setContract]      = useState(null);

  const [grievances,  setGrievances]  = useState([]);
  const [loading,     setLoading]     = useState(false);

  // Tracks which grievance is being updated and form values
  const [updateForm, setUpdateForm] = useState({
    id     : null,
    status : "InProgress",
    remarks: "",
  });
  const [updating,  setUpdating]  = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // ── CONNECT METAMASK ──────────────────────

  async function connectMeta() {
    try {
      const { web3, account, contract: c } = await connectWallet();
      setWalletAccount(account);
      setWeb3Instance(web3);
      setContract(c);
      alert("✅ MetaMask connected: " + account + "\nNow loading your assigned grievances...");
      loadGrievances(account);
    } catch (err) {
      alert("MetaMask error: " + err.message);
    }
  }

  // ── LOAD GRIEVANCES ────────────────────────

  // Auto-load on mount using the officer's registered wallet (no MetaMask needed)
  useEffect(() => {
    const addr = user()?.walletAddress;
    if (addr) loadGrievances(addr);
  }, []);

  async function loadGrievances(addr) {
    if (!addr) {
      setGrievances([]);
      return;
    }
    setLoading(true);

    try {
      const res  = await fetch(`${API}/grievances/officer/${addr}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setGrievances(data.grievances || []);
    } catch (err) {
      console.error("Failed to load grievances:", err.message);
    }

    setLoading(false);
  }

  // ── UPDATE STATUS (MetaMask signs the transaction) ─────────

  async function handleUpdate(e) {
    e.preventDefault();
    setUpdateMsg("");
    setUpdating(true);

    try {
      /**
       * The backend fetches the officer's wallet address from MongoDB using the
       * JWT token — no need to pass officerWallet from the frontend.
       * MetaMask is NOT required for status updates.
       */
      const res  = await fetch(`${API}/grievances/update/${updateForm.id}`, {
        method : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization : `Bearer ${token()}`,
        },
        body: JSON.stringify({
          newStatus: updateForm.status,
          remarks  : updateForm.remarks,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setUpdateMsg("❌ " + data.message);
      } else {
        setUpdateMsg("✅ Status updated! Tx: " + data.transactionHash);
        // Refresh using stored wallet or user profile wallet
        loadGrievances(walletAccount || user()?.walletAddress || "");
        setUpdateForm({ id: null, status: "InProgress", remarks: "" });
      }
    } catch (err) {
      setUpdateMsg("❌ Update failed: " + err.message);
    }

    setUpdating(false);
  }

  // ── LOGOUT ────────────────────────────────

  function logout() {
    localStorage.clear();
    navigate("/login");
  }

  // ── RENDER ────────────────────────────────

  const currentUser = user();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ecf0f1", padding: "30px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, color: "#2c3e50" }}>⛓ CivicChain — Officer Panel</h2>
            <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>
              {currentUser?.name} | {walletAccount ? "🦊 " + walletAccount.slice(0, 12) + "..." : "MetaMask not connected"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {!walletAccount && (
              <button onClick={connectMeta} style={{ ...btnStyle, backgroundColor: "#e67e22" }}>
                🦊 Connect MetaMask
              </button>
            )}
            <button onClick={logout} style={{ ...btnStyle, backgroundColor: "#e74c3c" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Info banner — shown when MetaMask not connected */}
        {!walletAccount && (
          <div style={{ ...cardStyle, backgroundColor: "#eaf4fb", border: "1px solid #aed6f1" }}>
            <strong>ℹ️ Your grievances load automatically from your registered wallet.</strong>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#555" }}>
              MetaMask is optional — connect it above only if you want to browse by a different wallet address.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        {walletAccount && (
          <button
            onClick={() => loadGrievances(walletAccount)}
            style={{ ...btnStyle, marginBottom: "16px", backgroundColor: "#27ae60" }}
          >
            🔄 Refresh Grievances
          </button>
        )}

        {/* Loading */}
        {loading && <p style={{ color: "#7f8c8d" }}>Loading grievances from blockchain...</p>}

        {/* Empty state */}
        {!loading && walletAccount && grievances.length === 0 && (
          <div style={cardStyle}>
            <p style={{ color: "#7f8c8d", margin: 0 }}>No grievances assigned to your wallet address yet.</p>
          </div>
        )}

        {/* Grievance cards */}
        {grievances.map((g) => (
          <div key={g.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ margin: "0 0 4px", color: "#2c3e50" }}>
                  #{g.id} — {g.title}
                </h4>
                <p style={{ margin: "0 0 4px", color: "#555", fontSize: "14px" }}>{g.description}</p>
                <p style={{ margin: "0", color: "#7f8c8d", fontSize: "13px" }}>
                  📍 {g.location} &nbsp;|&nbsp; 🏷 {g.category} &nbsp;|&nbsp; 🕐 {g.timestamp}
                </p>
                {g.remarks && (
                  <p style={{ margin: "6px 0 0", color: "#2980b9", fontSize: "13px" }}>
                    💬 Remarks: {g.remarks}
                  </p>
                )}
              </div>
              <span style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: "13px",
                backgroundColor: statusColor(g.status), color: "#fff", fontWeight: "bold",
                whiteSpace: "nowrap",
              }}>
                {g.status}
              </span>
            </div>

            {/* Show update form only for non-Resolved grievances */}
            {g.status !== "Resolved" && (
              <button
                onClick={() => setUpdateForm({ id: g.id, status: "InProgress", remarks: "" })}
                style={{ ...btnStyle, marginTop: "12px", fontSize: "13px" }}
              >
                ✏️ Update Status
              </button>
            )}

            {/* Inline update form */}
            {updateForm.id === g.id && (
              <div style={{ marginTop: "14px", padding: "16px", backgroundColor: "#f0f4f8", borderRadius: "8px" }}>
                <strong style={{ fontSize: "14px" }}>Update Grievance #{g.id}</strong>
                <select
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                >
                  {g.status === "Pending" && <option value="InProgress">InProgress</option>}
                  <option value="Resolved">Resolved</option>
                </select>
                <textarea
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box", marginBottom: "10px" }}
                  rows={3}
                  placeholder="Add your remarks here..."
                  value={updateForm.remarks}
                  onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                />

                {updateMsg && (
                  <div style={{
                    padding: "8px", borderRadius: "6px", marginBottom: "10px",
                    backgroundColor: updateMsg.startsWith("✅") ? "#eafaf1" : "#fdecea",
                    color: updateMsg.startsWith("✅") ? "#1e8449" : "#c0392b",
                    fontSize: "13px", wordBreak: "break-all",
                  }}>
                    {updateMsg}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleUpdate} style={btnStyle} disabled={updating}>
                    {updating ? "Signing & Submitting..." : "Confirm Update"}
                  </button>
                  <button
                    onClick={() => { setUpdateForm({ id: null, status: "InProgress", remarks: "" }); setUpdateMsg(""); }}
                    style={{ ...btnStyle, backgroundColor: "#7f8c8d" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}