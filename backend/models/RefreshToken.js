
import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  replacedByTokenHash: { type: String, default: null },
  ip: { type: String },
  userAgent: { type: String },
});

export default mongoose.model("RefreshToken", RefreshTokenSchema);