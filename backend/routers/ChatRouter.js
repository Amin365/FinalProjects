import { Router } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utility/cloudinary.js";
import { protect } from "../middleware/auth.js";
import { getChatContacts, getChatMessages, postChatMessage, uploadChatFile } from "../controller/ChatController.js";

const ChatRouter = Router();

const storage = new CloudinaryStorage({
	cloudinary,
	params: async (req, file) => {
		const original = String(file.originalname || "file");
		const safeBase = original
			.replace(/\.[^/.]+$/, "")
			.replace(/[^a-zA-Z0-9._-]/g, "_")
			.slice(0, 64);
		const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
		const mt = String(file.mimetype || "").toLowerCase();

		const resourceType = mt.startsWith("image/") ? "image" : mt.startsWith("audio/") || mt.startsWith("video/") ? "video" : "raw";
		const allowedFormats = mt.startsWith("image/")
			? ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]
			: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip", "rar", "7z", "mp3", "wav", "m4a", "mp4", "mov", "avi", "webm"];

		return {
			folder: "Chat/uploads",
			resource_type: resourceType,
			allowed_formats: allowedFormats,
			public_id: `${safeBase || "file"}-${unique}`,
		};
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 25 * 1024 * 1024 },
});

ChatRouter.get("/chats/contacts", protect, getChatContacts);
ChatRouter.get("/chats/messages/:peerId", protect, getChatMessages);
ChatRouter.post("/chats/messages/:peerId", protect, postChatMessage);
ChatRouter.post("/chats/upload", protect, upload.single("file"), uploadChatFile);

export default ChatRouter;
