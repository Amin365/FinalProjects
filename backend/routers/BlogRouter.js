import { Router } from "express";
import {
  createBlogPost,
  getBlogPosts,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  blogMetaPage,
  incrementViews,
  getFeaturedPosts,
  toggleFeature,
  togglePin,
  toggleEditorsPick,
  updateDisplayOrder,
  updateRelatedPosts,
  getScheduledPosts,
} from "../controller/BlogPostController.js";
import { protect } from '../middleware/auth.js'
import { apiLimiter } from "../utility/rateLimiter.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from '../utility/cloudinary.js'

const Blogrouter = Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Blog", // folder in cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    public_id: (req, file) => Date.now() + "-" + file.originalname.split(".")[0],
  },
});

// Updated to handle multiple fields: blog image and author picture
const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 }, // For blog_picture
  { name: 'author_picture', maxCount: 1 } // For author_picture
]);

// Public read endpoints
Blogrouter.get("/blogposts", getBlogPosts);
Blogrouter.get("/blogposts/featured", getFeaturedPosts);
Blogrouter.get("/blogposts/:id", getBlogPostById);

// Protected admin endpoints
Blogrouter.get("/blogposts-admin/scheduled", protect, apiLimiter, getScheduledPosts);

// Protected write endpoints - using uploadFields for multiple files
Blogrouter.post("/blogposts", protect, uploadFields, createBlogPost);
Blogrouter.put("/blogposts/:id", protect, uploadFields, updateBlogPost);
Blogrouter.delete("/blogposts/:id", protect, deleteBlogPost);

// Featured content management (admin/moderator only)
Blogrouter.put("/blogposts/:id/feature", protect, apiLimiter, toggleFeature);
Blogrouter.put("/blogposts/:id/pin", protect, apiLimiter, togglePin);
Blogrouter.put("/blogposts/:id/editors-pick", protect, apiLimiter, toggleEditorsPick);
Blogrouter.put("/blogposts/:id/display-order", protect, apiLimiter, updateDisplayOrder);
Blogrouter.put("/blogposts/:id/related-posts", protect, apiLimiter, updateRelatedPosts);

// Share and views
Blogrouter.get("/share/blog/:id", blogMetaPage);
Blogrouter.post("/blogposts/:id/views", incrementViews);

export default Blogrouter;