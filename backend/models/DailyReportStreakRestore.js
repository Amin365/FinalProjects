import mongoose from "mongoose";

const DailyReportStreakRestoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    monthKey: {
      type: String, // YYYY-MM
      required: true,
      index: true,
    },
    count: { type: Number, default: 0, min: 0 },
    restoredForDate: { type: String, default: "" }, // YYYY-MM-DD
  },
  { timestamps: true }
);

DailyReportStreakRestoreSchema.index({ user: 1, monthKey: 1 }, { unique: true });

const DailyReportStreakRestore = mongoose.model(
  "DailyReportStreakRestore",
  DailyReportStreakRestoreSchema
);

export default DailyReportStreakRestore;
