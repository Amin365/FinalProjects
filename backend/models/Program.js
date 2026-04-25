import mongoose from "mongoose";

const ProgramSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
      required: true,
      default: () => `prog${Date.now()}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    teacherId: {
      type: String,
      required: true,
      trim: true,
    },
    assistants: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed", "draft"],
      default: "active",
    },
  },
  { timestamps: true }
);

ProgramSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    throw new Error("endDate must be greater than or equal to startDate");
  }
});

const Program = mongoose.model("Program", ProgramSchema);

export default Program;
