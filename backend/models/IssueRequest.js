import mongoose from "mongoose";

const IssueRequestSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Issued", "Cancelled"],
      default: "Requested",
    },
    requestedDays: { type: Number, default: 7, min: 1, max: 14 },
    note: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
  },
  { timestamps: true }
);

IssueRequestSchema.index({ member: 1, status: 1 });
IssueRequestSchema.index({ book: 1, status: 1 });
IssueRequestSchema.index({ status: 1, createdAt: -1 });

const IssueRequest = mongoose.model("IssueRequest", IssueRequestSchema);
export default IssueRequest;
