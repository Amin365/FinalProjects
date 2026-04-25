import { Router } from "express";
import { protect } from "../middleware/auth.js";
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

// Cloudinary storage for resource files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type for folder organization
    const isFile = file.fieldname === "file";
    const folder = isFile ? "Resources/files" : "Resources/images";
    
    return {
      folder,
      allowed_formats: isFile 
        ? ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar"]
        : ["jpg", "jpeg", "png", "gif", "webp"],
      resource_type: isFile ? "raw" : "image",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// Public endpoints
ResourceRouter.get("/resources", getResources);
ResourceRouter.get("/resources/types/summary", getResourceTypeSummary);
ResourceRouter.get("/resources/:id", getResourceById);
ResourceRouter.post("/resources/:id/views", incrementResourceViews);
ResourceRouter.post("/resources/:id/downloads", incrementResourceDownloads);

// Protected endpoints (admin/moderator only)
ResourceRouter.post("/resources", protect, apiLimiter, uploadFields, createResource);
ResourceRouter.put("/resources/:id", protect, apiLimiter, uploadFields, updateResource);
ResourceRouter.delete("/resources/:id", protect, apiLimiter, deleteResource);

export default ResourceRouter;
