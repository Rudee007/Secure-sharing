const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  s3Key: { type: String, required: true }, 
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  expiresAt: { type: Date },
  encryption: {type: Boolean, default: false}
});

module.exports = mongoose.model("File", fileSchema);