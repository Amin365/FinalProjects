import mongoose from "mongoose";

const MemberNoteSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MemberNoteSchema.index({ member: 1, createdAt: -1 });

export default mongoose.model("MemberNote", MemberNoteSchema);
