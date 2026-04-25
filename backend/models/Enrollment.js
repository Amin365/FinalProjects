import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
      required: true,
      default: () => `enr${Date.now()}${Math.floor(Math.random() * 9000)}`,
    },
    programId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // status: confirmed | waitlisted | cancelled
    status: {
      type: String,
      enum: ["confirmed", "waitlisted", "cancelled"],
      default: "confirmed",
    },
    // optional attachments (file url, filename, mimetype)
    attachment: {
      url: { type: String },
      filename: { type: String },
      mimetype: { type: String },
      size: { type: Number },
    },
    // any arbitrary registration form answers
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // admin note or metadata
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent a user from having many non-cancelled enrollments for the same program
EnrollmentSchema.index({ programId: 1, userId: 1 }, { unique: false });

const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);

export default Enrollment;