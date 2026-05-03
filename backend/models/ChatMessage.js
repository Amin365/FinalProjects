import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    threadKey: { type: String, required: true, index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    text: { type: String, default: "", trim: true },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileMimeType: { type: String, default: null },
    fileSize: { type: Number, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ threadKey: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);

export default ChatMessage;
