import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true },
    message: { type: String, trim: true },
    type: { 
      type: String, 
      enum: ["info", "success", "warning", "error", "approval", "reminder", "announcement"], 
      default: "info", 
      index: true 
    },
    category: {
      type: String,
      enum: ["system", "issue", "report", "challenge", "achievement", "goal", "blog", "join", "announcement", "other"],
      default: "system",
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Object, default: {} },
    // For announcements - optional expiry date
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ category: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
