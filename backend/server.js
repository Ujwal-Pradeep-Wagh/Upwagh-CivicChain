/**
 * server.js — CivicChain Express Server Entry Point
 *
 * This file:
 *  1. Loads environment variables from .env
 *  2. Connects to MongoDB
 *  3. Sets up Express middleware (CORS, JSON parsing)
 *  4. Registers API routes
 *  5. Starts the server on port 5000
 */

// Load .env variables FIRST — before anything else
require("dotenv").config();

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");

// Import our route files
const authRoutes      = require("./routes/auth");
const grievanceRoutes = require("./routes/grievance");

// Create the Express app
const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────

// Allow requests from React frontend running on localhost:3000
app.use(cors({ origin: "http://localhost:3000" }));

// Parse incoming JSON request bodies
app.use(express.json());

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// All auth routes will be available at: http://localhost:5000/api/auth/...
app.use("/api/auth", authRoutes);

// All grievance routes: http://localhost:5000/api/grievances/...
app.use("/api/grievances", grievanceRoutes);

// Simple health-check route — visit in browser to confirm server is running
app.get("/", (req, res) => {
  res.json({ message: "CivicChain backend is running!" });
});

// ─────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    // Only start the server AFTER the database is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Stop the server if DB fails
  });