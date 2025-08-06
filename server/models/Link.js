const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  fileId: { type: String, ref: "File", required: true }, // ✅ Fixed: Changed to String
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  passwordHash: { type: String },
  expiresAt: { type: Date },
  isOneTime: { type: Boolean, default: false },
  isOneTimeDownload: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  permissions: {
    type: String,
    enum: ["Full Access", "View Only", "Edit", "Download"],
    default: "View Only"
  },
  isE2EE: { type: Boolean, default: false },
  iv: { type: String },
  encryptedSymmetricKey: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Link", linkSchema);
