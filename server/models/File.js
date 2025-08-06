const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  supabaseKey: { type: String, required: true },
  supabasePath: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  expiresAt: { type: Date },
  encryption: { type: Boolean, default: false },
  encryptedKey: { type: String, required: function() { return this.encryption; } },
  iv: { type: String, required: function() { return this.encryption; } },
  url: { type: String }, // Added for public URL
}, { timestamps: true });


module.exports = mongoose.model("File", fileSchema);