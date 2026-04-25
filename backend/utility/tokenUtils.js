
import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET || "please_set_a_secret"; // existing
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "7d"; // keep existing default

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || "please_set_a_secret") + "_refresh";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

// sign access token
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

// sign refresh token
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}