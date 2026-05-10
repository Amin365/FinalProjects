import crypto from "crypto";

export const INVITE_EXPIRES_HOURS = Number(process.env.INVITE_EXPIRES_HOURS || 72);
export const INVITE_EXPIRES_MS = INVITE_EXPIRES_HOURS * 60 * 60 * 1000;

export function createInviteToken() {
  return {
    inviteToken: crypto.randomBytes(32).toString("hex"),
    inviteTokenExpires: new Date(Date.now() + INVITE_EXPIRES_MS),
  };
}

export function getFrontendAppUrl() {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:5173";

  return String(raw)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
}

export function buildSetupPasswordUrl(inviteToken) {
  const appUrl = getFrontendAppUrl();
  return `${appUrl}/setup-password?token=${encodeURIComponent(inviteToken)}`;
}
