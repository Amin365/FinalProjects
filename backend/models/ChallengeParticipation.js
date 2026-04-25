import mongoose from "mongoose";

const ChallengeParticipationSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: "ReadingChallenge", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pagesRead: { type: Number, default: 0 },
  minutesRead: { type: Number, default: 0 },
  reportsCount: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  status: { type: String, enum: ["Active", "Completed", "Dropped"], default: "Active" },
}, { timestamps: true });

ChallengeParticipationSchema.index({ challenge: 1, user: 1 }, { unique: true });

const ChallengeParticipation = mongoose.model("ChallengeParticipation", ChallengeParticipationSchema);
export default ChallengeParticipation;
