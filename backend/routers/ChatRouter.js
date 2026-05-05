import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { protect } from "../middleware/auth.js";
import { getChatContacts, getChatMessages, postChatMessage, uploadChatFile } from "../controller/ChatController.js";

const ChatRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads/chat");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const safeOriginal = String(file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
		const ext = path.extname(safeOriginal).slice(0, 16);
		const base = path.basename(safeOriginal, ext).slice(0, 64);
		const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
		cb(null, `${base || "file"}-${unique}${ext}`);
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
