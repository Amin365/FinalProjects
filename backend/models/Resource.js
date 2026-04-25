import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    // your new file-oriented type
    type: {
      type: String,
      enum: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "video", "link", "other"],
      default: "pdf",
    },

    fileUrl: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },

    programId: { type: String, ref: "Program", default: null },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    accessLevel: {
      type: String,
      enum: ["public", "private", "program-only"],
      default: "public",
    },

    views: { type: Number, default: 0, min: 0 },
    downloads: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Resource", ResourceSchema);