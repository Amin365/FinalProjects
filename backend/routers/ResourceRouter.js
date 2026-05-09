import { Router } from "express";
import { protect, optionalProtect } from "../middleware/auth.js";
import { requireRoleOrPermission } from "../middleware/role.js";
import { apiLimiter } from "../utility/rateLimiter.js";
import multer from "multer";
import {
  createResource,
  getResources,
  getResourceById,
  getResourceFileById,
  updateResource,
  deleteResource,
  incrementResourceViews,
  incrementResourceDownloads,
  getResourceTypeSummary,
} from "../controller/ResourceController.js";

const ResourceRouter = Router();

const manageResources = [protect, requireRoleOrPermission(["admin", "super admin"], ["Manage Resource"])];
const DOCUMENT_FORMATS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "json"];
const ARCHIVE_FORMATS = ["zip", "rar", "7z"];
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_FORMATS = ["mp4", "mov", "avi", "mkv", "webm"];

const RESOURCE_FORMATS = [...DOCUMENT_FORMATS, ...ARCHIVE_FORMATS, ...IMAGE_FORMATS, ...VIDEO_FORMATS];

const getExtension = (filename = "") => {
  const ext = String(filename).split(".").pop();
  return ext && ext !== filename ? ext.toLowerCase() : "";
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = getExtension(file.originalname);
    const allowed = file.fieldname === "coverImage" ? IMAGE_FORMATS : RESOURCE_FORMATS;
    if (!allowed.includes(ext)) {
      return cb(new Error(`Unsupported file format: .${ext || "unknown"}`));
    }
    cb(null, true);
  },
});
const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);
const handleUploadFields = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (!err) return next();
    const status = err instanceof multer.MulterError ? 400 : 415;
    return res.status(status).json({
      success: false,
      message: err.message || "File upload failed",
      status,
    });
  });
};

// Public endpoints
ResourceRouter.get("/resources", optionalProtect, getResources);
ResourceRouter.get("/resources/types/summary", getResourceTypeSummary);
ResourceRouter.get("/resources/:id/file", getResourceFileById);
ResourceRouter.get("/resources/:id", getResourceById);
ResourceRouter.post("/resources/:id/views", incrementResourceViews);
ResourceRouter.post("/resources/:id/downloads", incrementResourceDownloads);

// Protected endpoints (admin/moderator only)
ResourceRouter.post("/resources", manageResources, apiLimiter, handleUploadFields, createResource);
ResourceRouter.put("/resources/:id", manageResources, apiLimiter, handleUploadFields, updateResource);
ResourceRouter.delete("/resources/:id", manageResources, apiLimiter, deleteResource);

export default ResourceRouter;
