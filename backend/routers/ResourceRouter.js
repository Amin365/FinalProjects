import { Router } from "express";
import { protect, optionalProtect } from "../middleware/auth.js";
import { requireRoleOrPermission } from "../middleware/role.js";
import { apiLimiter } from "../utility/rateLimiter.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utility/cloudinary.js";
import {
  createResource,
  getResources,
  getResourceById,
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

// Cloudinary storage for resource files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type for folder organization
    const isResourceFile = file.fieldname === "file";
    const isVideo = file.mimetype?.startsWith("video/");
    const isImage = file.mimetype?.startsWith("image/");
    const folder = isResourceFile
      ? isVideo
        ? "Resources/videos"
        : isImage
          ? "Resources/images"
          : "Resources/files"
      : "Resources/images";
    
    return {
      folder,
      allowed_formats: isResourceFile
        ? [...DOCUMENT_FORMATS, ...ARCHIVE_FORMATS, ...IMAGE_FORMATS, ...VIDEO_FORMATS]
        : IMAGE_FORMATS,
      resource_type: isVideo ? "video" : isImage ? "image" : "raw",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});
const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// Public endpoints
ResourceRouter.get("/resources", optionalProtect, getResources);
ResourceRouter.get("/resources/types/summary", getResourceTypeSummary);
ResourceRouter.get("/resources/:id", getResourceById);
ResourceRouter.post("/resources/:id/views", incrementResourceViews);
ResourceRouter.post("/resources/:id/downloads", incrementResourceDownloads);

// Protected endpoints (admin/moderator only)
ResourceRouter.post("/resources", manageResources, apiLimiter, uploadFields, createResource);
ResourceRouter.put("/resources/:id", manageResources, apiLimiter, uploadFields, updateResource);
ResourceRouter.delete("/resources/:id", manageResources, apiLimiter, deleteResource);

export default ResourceRouter;
