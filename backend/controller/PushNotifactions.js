import PushSubscription from "../models/ushSubscription.js";

// Save push subscription
export const subscribePush = async (req, res) => {
  try {
    const userId = req.user._id;
    const subscription = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    // Prevent duplicate subscriptions
    await PushSubscription.findOneAndUpdate(
      { user: userId, "subscription.endpoint": subscription.endpoint },
      { subscription },
      { upsert: true, new: true }
    );

    return res.status(201).json({ message: "Push subscription saved" });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return res.status(500).json({ message: "Failed to save subscription" });
  }
};
