import mongoose from "mongoose";

const UserAchievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  achievementCode: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
}, { timestamps: true });

UserAchievementSchema.index({ user: 1, achievementCode: 1 }, { unique: true });

const UserAchievement = mongoose.model("UserAchievement", UserAchievementSchema);
export default UserAchievement;
