/**
 * routes/auth.js — Register & Login Routes
 *
 * POST /api/auth/register  → Create a new user account
 * POST /api/auth/login     → Login and receive a JWT token
 * GET  /api/auth/me        → Get currently logged-in user info (protected)
 *
 * JWT (JSON Web Token) is used for session management.
 * The frontend stores the token in localStorage and sends it with every request.
 */

const express = require("express");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");

const router = express.Router();

// ─────────────────────────────────────────────
// HELPER — Generate JWT Token
// ─────────────────────────────────────────────

/**
 * Creates a signed JWT token containing the user's ID and role.
 * The token expires in 7 days.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },  // Payload stored inside the token
    process.env.JWT_SECRET,              // Secret key to sign it
    { expiresIn: "7d" }                  // Token validity
  );
}

// ─────────────────────────────────────────────
// MIDDLEWARE — Verify JWT Token
// ─────────────────────────────────────────────

/**
 * This middleware checks if a valid JWT token is present in the request header.
 * Use it on any route that requires login.
 *
 * The frontend must send: Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
  // Get the Authorization header value
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Please login." });
  }

  // Extract the token part (remove "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request so next middleware/route can use it
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// verifyToken is exported at the bottom of this file alongside the router

// ─────────────────────────────────────────────
// ROUTE: POST /api/auth/register
// ─────────────────────────────────────────────

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Create and save the new user
    // Password will be hashed automatically by the pre-save middleware in User.js
    const user = new User({ name, email, password, role, walletAddress });
    await user.save();

    // Generate token for immediate login after registration
    const token = generateToken(user);

    res.status(201).json({
      message: "Account created successfully!",
      token,
      user: {
        id           : user._id,
        name         : user.name,
        email        : user.email,
        role         : user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ─────────────────────────────────────────────
// ROUTE: POST /api/auth/login
// ─────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    // Compare entered password with the hashed one in MongoDB
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: "Login successful!",
      token,
      user: {
        id           : user._id,
        name         : user.name,
        email        : user.email,
        role         : user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/auth/me  (Protected)
// ─────────────────────────────────────────────

router.get("/me", verifyToken, async (req, res) => {
  try {
    // req.user.id was set by verifyToken middleware
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ user });
  } catch (err) {
    console.error("Get me error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// ROUTE: GET /api/auth/officers
// Returns all officers (Citizens need this to pick who to assign a grievance to)
// ─────────────────────────────────────────────

router.get("/officers", verifyToken, async (req, res) => {
  try {
    const officers = await User.find({ role: "officer" }).select(
      "name email walletAddress"
    );
    res.json({ officers });
  } catch (err) {
    console.error("Get officers error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// ROUTE: PUT /api/auth/update-wallet  (Protected)
// Lets an officer update their wallet address
// ─────────────────────────────────────────────

router.put("/update-wallet", verifyToken, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    ).select("-password");

    res.json({
      message: "Wallet address updated successfully!",
      user: {
        id           : user._id,
        name         : user.name,
        email        : user.email,
        role         : user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    console.error("Update wallet error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
module.exports.verifyToken = verifyToken;