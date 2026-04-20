/**
 * config/web3.js — Web3.js Setup for the Backend
 *
 * Exports an async `initWeb3()` function that:
 *  1. Connects to Ganache
 *  2. Reads the LIVE network ID from Ganache
 *  3. Looks up the correct contract address for that network in Grievance.json
 *  4. Returns { web3, grievanceContract, contractAddress }
 *
 * Using async init avoids the "Returned values aren't valid" error that occurs
 * when Grievance.json has stale network entries and the wrong address is picked.
 */

const Web3 = require("web3");
const path = require("path");
const fs   = require("fs");

// ─────────────────────────────────────────────
// Load the compiled contract JSON (sync — file must exist)
// ─────────────────────────────────────────────

const contractJsonPath = path.join(
  __dirname,
  "../../blockchain/build/contracts/Grievance.json"
);

if (!fs.existsSync(contractJsonPath)) {
  console.error(
    "❌ Grievance.json not found! Run `truffle compile` and `truffle migrate` first."
  );
  process.exit(1);
}

const GrievanceJSON = JSON.parse(fs.readFileSync(contractJsonPath, "utf8"));
const contractABI   = GrievanceJSON.abi;
const networkEntries = GrievanceJSON.networks;

if (Object.keys(networkEntries).length === 0) {
  console.error("❌ No deployed contract found in Grievance.json! Run `truffle migrate`.");
  process.exit(1);
}

// ─────────────────────────────────────────────
// Create Web3 instance (connects to Ganache)
// ─────────────────────────────────────────────

const web3 = new Web3(process.env.GANACHE_URL || "http://127.0.0.1:7545");

// ─────────────────────────────────────────────
// Async init — resolves correct contract address by querying live network ID
// ─────────────────────────────────────────────

async function initWeb3() {
  // Ask Ganache what network it's running
  const liveNetworkId = String(await web3.eth.net.getId());

  let contractAddress;

  if (networkEntries[liveNetworkId]) {
    // Best case: exact match for the live network
    contractAddress = networkEntries[liveNetworkId].address;
    console.log(`✅ Grievance contract loaded at address: ${contractAddress} (network ${liveNetworkId})`);
  } else {
    // Fallback — warn the user and use the last entry
    const ids   = Object.keys(networkEntries);
    const lastId = ids[ids.length - 1];
    contractAddress = networkEntries[lastId].address;
    console.warn(`⚠️  Live network ID ${liveNetworkId} not found in Grievance.json.`);
    console.warn(`   Falling back to network ${lastId}: ${contractAddress}`);
    console.warn("   To fix permanently: stop Ganache, run `truffle migrate --reset`, restart backend.");
  }

  const grievanceContract = new web3.eth.Contract(contractABI, contractAddress);
  return { web3, grievanceContract, contractAddress };
}

module.exports = { initWeb3, web3 };