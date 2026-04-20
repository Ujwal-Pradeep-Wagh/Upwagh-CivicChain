/**
 * utils/web3.js — MetaMask Connection + Web3.js Helper
 *
 * This file handles everything needed to use the blockchain from the browser:
 *  1. Detect MetaMask
 *  2. Ask the user to connect their MetaMask wallet
 *  3. Create a Web3 instance using MetaMask as the provider
 *  4. Load the Grievance smart contract so pages can call its functions
 *
 * MetaMask injects a global object called `window.ethereum` into the browser.
 * Web3.js uses that as the "provider" — the connection to the blockchain.
 */

import Web3 from "web3";

// ─────────────────────────────────────────────
// IMPORTANT: Paste your contract address here
// after running `truffle migrate`
// You will find it printed in the terminal, OR
// inside blockchain/build/contracts/Grievance.json
// under networks → [networkId] → address
// ─────────────────────────────────────────────
const CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

/**
 * The ABI tells Web3.js exactly what functions the contract has and
 * what arguments each function takes/returns.
 *
 * Copy this from: blockchain/build/contracts/Grievance.json → "abi" array
 * Paste the entire array below, replacing the placeholder.
 */
const CONTRACT_ABI = [
  // submitGrievance(string,string,string,string,address)
  {
    inputs: [
      { internalType: "string",  name: "_title",       type: "string"  },
      { internalType: "string",  name: "_description", type: "string"  },
      { internalType: "string",  name: "_location",    type: "string"  },
      { internalType: "string",  name: "_category",    type: "string"  },
      { internalType: "address", name: "_officer",     type: "address" },
    ],
    name    : "submitGrievance",
    outputs : [],
    stateMutability: "nonpayable",
    type    : "function",
  },
  // updateStatus(uint256,uint8,string)
  {
    inputs: [
      { internalType: "uint256", name: "_id",      type: "uint256" },
      { internalType: "uint8",   name: "_status",  type: "uint8"   },
      { internalType: "string",  name: "_remarks", type: "string"  },
    ],
    name    : "updateStatus",
    outputs : [],
    stateMutability: "nonpayable",
    type    : "function",
  },
  // getGrievance(uint256)
  {
    inputs : [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name   : "getGrievance",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id",              type: "uint256" },
          { internalType: "string",  name: "title",           type: "string"  },
          { internalType: "string",  name: "description",     type: "string"  },
          { internalType: "string",  name: "location",        type: "string"  },
          { internalType: "string",  name: "category",        type: "string"  },
          { internalType: "address", name: "citizen",         type: "address" },
          { internalType: "address", name: "assignedOfficer", type: "address" },
          { internalType: "uint8",   name: "status",          type: "uint8"   },
          { internalType: "uint256", name: "timestamp",       type: "uint256" },
          { internalType: "string",  name: "remarks",         type: "string"  },
        ],
        internalType: "tuple",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getAllGrievances()
  {
    inputs : [],
    name   : "getAllGrievances",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id",              type: "uint256" },
          { internalType: "string",  name: "title",           type: "string"  },
          { internalType: "string",  name: "description",     type: "string"  },
          { internalType: "string",  name: "location",        type: "string"  },
          { internalType: "string",  name: "category",        type: "string"  },
          { internalType: "address", name: "citizen",         type: "address" },
          { internalType: "address", name: "assignedOfficer", type: "address" },
          { internalType: "uint8",   name: "status",          type: "uint8"   },
          { internalType: "uint256", name: "timestamp",       type: "uint256" },
          { internalType: "string",  name: "remarks",         type: "string"  },
        ],
        internalType: "tuple[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // grievanceCount() — public state variable, auto-generates a getter
  {
    inputs : [],
    name   : "grievanceCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "id",        type: "uint256" },
      { indexed: true,  internalType: "address", name: "citizen",   type: "address" },
      { indexed: false, internalType: "string",  name: "title",     type: "string"  },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "GrievanceSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "uint256", name: "id",        type: "uint256" },
      { indexed: true,  internalType: "address", name: "officer",   type: "address" },
      { indexed: false, internalType: "uint8",   name: "newStatus", type: "uint8"   },
      { indexed: false, internalType: "string",  name: "remarks",   type: "string"  },
    ],
    name: "StatusUpdated",
    type: "event",
  },
];

// ─────────────────────────────────────────────
// STATUS HELPER — shared across all pages
// ─────────────────────────────────────────────

export function mapStatus(code) {
  const map = { 0: "Pending", 1: "InProgress", 2: "Resolved" };
  return map[Number(code)] || "Unknown";
}

export function statusColor(status) {
  if (status === "Pending")    return "#e67e22";
  if (status === "InProgress") return "#2980b9";
  if (status === "Resolved")   return "#27ae60";
  return "#7f8c8d";
}

// ─────────────────────────────────────────────
// MAIN EXPORT — connectWallet()
// ─────────────────────────────────────────────

/**
 * connectWallet()
 *
 * Asks the user to connect MetaMask, then returns:
 *  - web3           : Web3 instance (for making contract calls)
 *  - account        : The user's connected MetaMask wallet address
 *  - contract       : The Grievance contract instance ready to call
 *
 * Usage in a React component:
 *   const { web3, account, contract } = await connectWallet();
 *   const count = await contract.methods.grievanceCount().call();
 */
export async function connectWallet() {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install the MetaMask browser extension."
    );
  }

  // Request the user to connect their wallet
  // This opens the MetaMask popup asking for permission
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  // Create Web3 instance using MetaMask as the provider
  const web3 = new Web3(window.ethereum);

  // Get the first connected account (the active MetaMask account)
  const account = accounts[0];

  // Create the contract instance
  const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

  return { web3, account, contract };
}