import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },

    issueDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Issued", "Returned", "Overdue"],
      default: "Issued",
    },

    returnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Issue = mongoose.model("Issue", IssueSchema);
export default Issue;