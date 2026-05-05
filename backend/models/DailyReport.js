import mongoose from "mongoose";

const DailyReportSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    readingDate: {
      type: Date,
      required: true,
      index: true,
    },

    pagesFrom: { type: Number, required: true, min: 0 },
    pagesTo: { type: Number, required: true, min: 0 },
    timeSpent: { type: Number, required: true, min: 0 },
    summary: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },

    status: {
      type: String,
      enum: ["Approved", "Pending", "Needs Improvement"],
      default: "Pending",
      index: true,
    },
  },
  { timestamps: true }
);

DailyReportSchema.index({ createdBy: 1, book: 1, readingDate: -1 });

const DailyReport = mongoose.model("DailyReport", DailyReportSchema);
export default DailyReport;
