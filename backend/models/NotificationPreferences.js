import mongoose from "mongoose";

const NotificationPreferencesSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      unique: true, 
      index: true 
    },
    
    // Push notification preferences
    pushOnOverdue: { type: Boolean, default: true },
    pushOnDueTomorrow: { type: Boolean, default: true },
    pushOnStreakReminder: { type: Boolean, default: true },
    pushOnBlogAnnouncement: { type: Boolean, default: true },
    pushOnJoinRequestUpdate: { type: Boolean, default: true },
    pushOnChallengeReminder: { type: Boolean, default: true },
    pushOnAchievementUnlock: { type: Boolean, default: true },
    pushOnGoalProgress: { type: Boolean, default: true },
    pushOnSystemAnnouncement: { type: Boolean, default: true },
    
    // Email notification preferences
    emailOnOverdue: { type: Boolean, default: true },
    emailOnDueTomorrow: { type: Boolean, default: false },
    emailOnWeeklyDigest: { type: Boolean, default: true },
    emailOnJoinRequestUpdate: { type: Boolean, default: true },
    emailOnGoalProgress: { type: Boolean, default: true },
    emailOnAnnouncement: { type: Boolean, default: true },
    
    // Quiet hours (optional)
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursStart: { type: String, default: "22:00" }, // HH:MM format
    quietHoursEnd: { type: String, default: "08:00" },   // HH:MM format
  },
  { timestamps: true }
);

const NotificationPreferences = mongoose.model("NotificationPreferences", NotificationPreferencesSchema);
export default NotificationPreferences;
