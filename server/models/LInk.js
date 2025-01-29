const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  passwordHash: { type: String },
  expiresAt: { type: Date, required: true }, 
  isOneTime: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  permissions: { type: String, enum: ["view", "edit"], default: "view" },
});

module.exports = mongoose.model("Link", linkSchema);