import webpush from "web-push";
import PushSubscription from "../models/ushSubscription.js";

webpush.setVapidDetails(
  "mailto:admin@jjureadingclub.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPushToUser(userId, payload) {
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
