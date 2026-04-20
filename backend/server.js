/**
 * server.js — CivicChain Express Server Entry Point
 *
 * Start order:
 *  1. Load .env
 *  2. Connect to MongoDB
 *  3. Initialize Web3 + load contract from Ganache (async)
 *  4. Register routes (passing web3/contract into grievance router)
 *  5. Start listening
 */

require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");

const { initWeb3 }   = require("./config/web3");
const authRoutes     = require("./routes/auth");

const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─────────────────────────────────────────────
// Auth routes (no blockchain dependency)
// ─────────────────────────────────────────────

app.use("/api/auth", authRoutes);

// Simple health-check
app.get("/", (req, res) => {
  res.json({ message: "CivicChain backend is running!" });
});

// ─────────────────────────────────────────────
// BOOT SEQUENCE — async so we can await Web3 init
// ─────────────────────────────────────────────

async function boot() {
  // 1. Connect MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // 2. Initialize Web3 + resolve correct contract address from live Ganache
  const { web3, grievanceContract, contractAddress } = await initWeb3();

  // 3. Register grievance routes (inject web3 + contract)
  const grievanceRoutes = require("./routes/grievance")({ web3, grievanceContract });
  app.use("/api/grievances", grievanceRoutes);

  // 4. Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`   Contract address: ${contractAddress}`);
  });
}

boot().catch((err) => {
  console.error("❌ Boot failed:", err.message);
  process.exit(1);
});