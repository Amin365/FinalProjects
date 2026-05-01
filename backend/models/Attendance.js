import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    programId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: [
      {
        studentId: { type: String, required: true, trim: true },
        status: {
          type: String,
          enum: ["present", "absent", "late", "excused"],
          default: "absent",
        },
        name: { type: String, default: "", trim: true },
        email: { type: String, default: "", trim: true },
      },
    ],
  },
  { timestamps: true }
);

AttendanceSchema.index({ programId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
