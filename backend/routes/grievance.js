/**
 * routes/grievance.js — Grievance API Routes using Web3.js
 *
 * These routes use Web3.js (server-side) to read from and write to
 * the Grievance smart contract deployed on Ganache.
 *
 * ROUTES:
 *  POST /api/grievances/submit         → Submit a new grievance (Citizen)
 *  GET  /api/grievances/all            → Get all grievances (Admin)
 *  GET  /api/grievances/:id            → Get single grievance by ID
 *  GET  /api/grievances/officer/:addr  → Get grievances assigned to an officer
 *  PUT  /api/grievances/update/:id     → Update grievance status (Officer)
 *
 * IMPORTANT ABOUT WEB3 + BACKEND:
 * - READ calls (getGrievance, getAllGrievances) are FREE — no MetaMask needed.
 *   We can call them directly from the backend using any Ganache account.
 * - WRITE calls (submitGrievance, updateStatus) cost gas.
 *   For backend-initiated writes, we use a Ganache account + private key.
 *   In a real app, writes would be signed by MetaMask on the frontend.
 *   Here we support BOTH: frontend can pass a signed tx, or backend uses Ganache accounts.
 */

const express         = require("express");
const { verifyToken } = require("./auth");

/**
 * Factory function — receives web3 + grievanceContract injected from server.js.
 * This ensures we always use the address matched to the live Ganache network.
 */
module.exports = function grievanceRouter({ web3, grievanceContract }) {
const router = express.Router();

// ─────────────────────────────────────────────
// HELPER — Get a Ganache account for backend transactions
// ─────────────────────────────────────────────

/**
 * For backend-initiated blockchain writes, we use the first Ganache account.
 * Ganache gives us 10 pre-funded accounts — we use account[0] as the "server account".
 *
 * NOTE: In a real production app, you would NEVER expose private keys on the backend.
 * For this localhost mini-project, using Ganache test accounts is fine.
 */
async function getServerAccount() {
  const accounts = await web3.eth.getAccounts();
  return accounts[0]; // First Ganache account
}

// ─────────────────────────────────────────────
// ROUTE: POST /api/grievances/submit
// Submit a new grievance — called by Citizen
// ─────────────────────────────────────────────

router.post("/submit", verifyToken, async (req, res) => {
  try {
    const { title, description, location, category, officerWallet } = req.body;

    // Basic validation
    if (!title || !description || !location || !category || !officerWallet) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Get a Ganache account to pay for the transaction gas
    const serverAccount = await getServerAccount();

    /**
     * Call submitGrievance() on the smart contract.
     *
     * .send() is used for WRITE operations (they change blockchain state).
     * .call() is used for READ operations (they don't change state, no gas).
     *
     * 'from' is the account paying the gas. We use the server's Ganache account.
     * 'gas' is the maximum gas units we're willing to spend (3,000,000 is safe for this).
     */
    const receipt = await grievanceContract.methods
      .submitGrievance(title, description, location, category, officerWallet)
      .send({ from: serverAccount, gas: 3000000 });

    // The transaction receipt contains the transaction hash and event logs
    res.status(201).json({
      message        : "Grievance submitted to blockchain successfully!",
      transactionHash: receipt.transactionHash,
      // The GrievanceSubmitted event emitted by the contract
      events         : receipt.events,
    });
  } catch (err) {
    console.error("Submit grievance error:", err.message);
    res.status(500).json({ message: "Blockchain transaction failed: " + err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/grievances/all
// Get all grievances — called by Admin/Auditor
// ─────────────────────────────────────────────

router.get("/all", verifyToken, async (req, res) => {
  try {
    // Only admin can access this route
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    /**
     * .call() is used for READ operations — no gas, no MetaMask, instant.
     * getAllGrievances() returns an array of GrievanceRecord structs.
     */
    const grievances = await grievanceContract.methods
      .getAllGrievances()
      .call();

    // Convert the raw blockchain data into a cleaner format for the frontend
    const formatted = grievances.map((g) => ({
      id             : g.id,
      title          : g.title,
      description    : g.description,
      location       : g.location,
      category       : g.category,
      citizen        : g.citizen,
      assignedOfficer: g.assignedOfficer,
      status         : mapStatus(g.status),   // Convert 0/1/2 to readable string
      timestamp      : new Date(Number(g.timestamp) * 1000).toLocaleString(),
      remarks        : g.remarks,
    }));

    res.json({ count: formatted.length, grievances: formatted });
  } catch (err) {
    console.error("Get all grievances error:", err.message);
    res.status(500).json({ message: "Failed to fetch from blockchain: " + err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/grievances/:id
// Get a single grievance by ID
// ─────────────────────────────────────────────

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const g = await grievanceContract.methods.getGrievance(id).call();

    res.json({
      grievance: {
        id             : g.id,
        title          : g.title,
        description    : g.description,
        location       : g.location,
        category       : g.category,
        citizen        : g.citizen,
        assignedOfficer: g.assignedOfficer,
        status         : mapStatus(g.status),
        timestamp      : new Date(Number(g.timestamp) * 1000).toLocaleString(),
        remarks        : g.remarks,
      },
    });
  } catch (err) {
    console.error("Get grievance error:", err.message);
    res.status(500).json({ message: "Failed to fetch grievance: " + err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/grievances/officer/:addr
// Get all grievances assigned to a specific officer wallet address
// ─────────────────────────────────────────────

router.get("/officer/:addr", verifyToken, async (req, res) => {
  try {
    const { addr } = req.params;

    // Fetch ALL grievances, then filter by assignedOfficer address
    const all = await grievanceContract.methods.getAllGrievances().call();

    const assigned = all
      .filter(
        (g) => g.assignedOfficer.toLowerCase() === addr.toLowerCase()
      )
      .map((g) => ({
        id             : g.id,
        title          : g.title,
        description    : g.description,
        location       : g.location,
        category       : g.category,
        citizen        : g.citizen,
        assignedOfficer: g.assignedOfficer,
        status         : mapStatus(g.status),
        timestamp      : new Date(Number(g.timestamp) * 1000).toLocaleString(),
        remarks        : g.remarks,
      }));

    res.json({ count: assigned.length, grievances: assigned });
  } catch (err) {
    console.error("Get officer grievances error:", err.message);
    res.status(500).json({ message: "Failed to fetch: " + err.message });
  }
});

// ─────────────────────────────────────────────
// ROUTE: PUT /api/grievances/update/:id
// Update grievance status — called by Officer
// Officer must be logged in and their wallet must match the assignedOfficer on-chain
// ─────────────────────────────────────────────

router.put("/update/:id", verifyToken, async (req, res) => {
  try {
    // Only officers can update status
    if (req.user.role !== "officer") {
      return res.status(403).json({ message: "Access denied. Officers only." });
    }

    const { id }                  = req.params;
    const { newStatus, remarks }  = req.body;

    if (!newStatus || !remarks) {
      return res.status(400).json({ message: "newStatus and remarks are required." });
    }

    /**
     * Map status string → Solidity enum number:
     *   Pending = 0, InProgress = 1, Resolved = 2
     */
    const statusMap  = { Pending: 0, InProgress: 1, Resolved: 2 };
    const statusCode = statusMap[newStatus];

    if (statusCode === undefined) {
      return res.status(400).json({ message: "Invalid status. Use: Pending, InProgress, or Resolved" });
    }

    /**
     * SECURE APPROACH: Fetch the officer's wallet address from MongoDB
     * using their JWT user ID — do NOT trust walletAddress from the request body.
     *
     * This also fixes the "sender account not recognized" error: the
     * MetaMask-connected account on the frontend may differ from the wallet
     * the officer registered with. By using the DB wallet we always have the
     * correct address, and we can look up its Ganache private key to sign.
     */
    const User = require("../models/User");
    const officer = await User.findById(req.user.id).select("walletAddress");

    if (!officer || !officer.walletAddress) {
      return res.status(400).json({ message: "Officer profile has no wallet address. Please update your profile." });
    }

    // Normalise to checksummed address (DB stores lowercase, key map uses checksummed)
    const officerWallet = web3.utils.toChecksumAddress(officer.walletAddress);

    // Load the Ganache private key map from .env
    const keyMap     = JSON.parse(process.env.GANACHE_PRIVATE_KEYS || "{}");
    const privateKey = keyMap[officerWallet] || keyMap[officer.walletAddress];

    if (!privateKey) {
      return res.status(400).json({
        message:
          `Officer wallet (${officerWallet}) is not a recognised Ganache test account. ` +
          "Please update your profile wallet address to one of the 10 Ganache addresses shown at startup.",
      });
    }

    // Encode the contract call
    const txData = grievanceContract.methods
      .updateStatus(id, statusCode, remarks)
      .encodeABI();

    // Estimate gas
    const gasEstimate = await grievanceContract.methods
      .updateStatus(id, statusCode, remarks)
      .estimateGas({ from: officerWallet });

    const nonce    = await web3.eth.getTransactionCount(officerWallet, "pending");
    const gasPrice = await web3.eth.getGasPrice();

    // Build raw transaction
    const rawTx = {
      nonce   : web3.utils.toHex(nonce),
      gasPrice: web3.utils.toHex(gasPrice),
      gas     : web3.utils.toHex(Math.ceil(gasEstimate * 1.3)),
      to      : grievanceContract.options.address,
      data    : txData,
    };

    // Sign with the officer's private key
    const signed  = await web3.eth.accounts.signTransaction(rawTx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);

    res.json({
      message        : "Grievance status updated on blockchain!",
      transactionHash: receipt.transactionHash,
    });
  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({ message: "Blockchain transaction failed: " + err.message });
  }
});

// ─────────────────────────────────────────────
// HELPER — Map Solidity enum number to readable string
// ─────────────────────────────────────────────

/**
 * The blockchain stores status as a number (0, 1, 2).
 * This converts it to a human-readable string.
 *
 * @param {string|number} statusCode - The status number from the contract
 * @returns {string} - "Pending", "InProgress", or "Resolved"
 */
function mapStatus(statusCode) {
  const map = { 0: "Pending", 1: "InProgress", 2: "Resolved" };
  return map[statusCode] || "Unknown";
}

return router;
}; // end grievanceRouter factory