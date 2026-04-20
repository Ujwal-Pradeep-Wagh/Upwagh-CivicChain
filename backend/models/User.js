/**
 * models/User.js — Mongoose Schema for User Accounts
 *
 * MongoDB stores ONLY user account info (name, email, password, role, wallet address).
 * ALL grievance data lives on the blockchain — NOT in MongoDB.
 *
 * Roles:
 *  - "citizen"  → Can submit grievances
 *  - "officer"  → Can update grievance status (uses MetaMask)
 *  - "admin"    → Can view all grievances (read-only)
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// Define the shape of a user document in MongoDB
const UserSchema = new mongoose.Schema(
  {
    name: {
      type    : String,
      required: [true, "Name is required"],
      trim    : true,
    },

    email: {
      type     : String,
      required : [true, "Email is required"],
      unique   : true,           // No two users can have the same email
      lowercase: true,
      trim     : true,
    },

    password: {
      type    : String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    role: {
      type   : String,
      enum   : ["citizen", "officer", "admin"],  // Only these 3 values allowed
      default: "citizen",
    },

    // The user's Ethereum wallet address (from MetaMask)
    // Required for officers and admins so the backend knows which blockchain
    // account to use when calling contract functions.
    walletAddress: {
      type     : String,
      default  : "",
      lowercase: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// MIDDLEWARE — Hash password before saving
// ─────────────────────────────────────────────

// This runs automatically before every .save() call
UserSchema.pre("save", async function (next) {
  // Only hash if the password was actually changed (avoid double-hashing)
  if (!this.isModified("password")) return next();

  // bcrypt hash with salt rounds = 10 (higher = slower but more secure)
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ─────────────────────────────────────────────
// METHOD — Compare password at login
// ─────────────────────────────────────────────

// Call this as: user.comparePassword("plaintextPassword")
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);