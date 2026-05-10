import webpush from "web-push";
import PushSubscription from "../models/ushSubscription.js";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("Push notifications disabled: missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
    return false;
  }

  webpush.setVapidDetails(
    "mailto:admin@jjureadingclub.com",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
}

export async function sendPushToUser(userId, payload) {
  if (!ensureVapidConfigured()) return;

  const subs = await PushSubscription.find({ user: userId }).lean();
  if (!subs.length) return;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
      console.error("Push failed, deleting subscription:", err.message);
      await PushSubscription.deleteOne({ _id: sub._id });
    }
  }
}
