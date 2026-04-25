import mongoose from "mongoose";

const AchievementSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "🏆" },
  unlockRules: {
    type: { type: String, enum: ["first_report", "streak", "reports_count", "pages_count"] },
    threshold: { type: Number, default: 1 },
  },
}, { timestamps: true });

const Achievement = mongoose.model("Achievement", AchievementSchema);
export default Achievement;
