import express from "express";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import {
  getUsers,
  getUserById,
  createUserFromMember,
  updateUserStatus,
  getAvailableMembersForUserCreation,
  updateProfile,
  changePassword,
  adminUpdateUserById,
  adminSetUserPassword,
  deleteAccount,
  getProfile,
  forgotPassword,
  resetPassword,
  resendResetCode,
  verifyResetCode
} from "../controller/UserController.js";

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from '../utility/cloudinary.js'

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "Profile",
//     allowed_formats: ["jpg", "jpeg", "png", "gif"],
//     public_id: (req, file) => Date.now() + "-" + file.originalname.split(".")[0],
//   }
// });
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Profile",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "heic", "heif"],
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname.split(".")[0],
  },
});



const upload = multer({ storage ,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB file size limit
});

const router = express.Router();

const viewUsers = [protect, requirePermission("View Users")];
const addUsers = [protect, requirePermission("Add Users")];
const editUsers = [protect, requirePermission("Edit Users")];

// Profile routes (for current user, no admin guard)
// router.put("/profile", protect, upload.single('profile'), updateProfile); 

router.put(
  "/profile",
  protect,
  (req, res, next) => {
    upload.single("profile")(req, res, (err) => {
      if (err) {
        console.error("🔥 MULTER ERROR:", err);
        return res.status(400).json({
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  updateProfile
);

router.put("/profile/change-password", protect, changePassword); // Change password
router.delete("/profile/delete", protect, deleteAccount); // Delete account

// Users management routes (admin only)
router.get('/available_members', addUsers, getAvailableMembersForUserCreation);
router.get("/users", viewUsers, getUsers);
router.get("/users/:id", viewUsers, getUserById);
router.post("/users/from-member", addUsers, createUserFromMember);
router.patch("/users/:id", editUsers, adminUpdateUserById);
router.put("/users/:id/password", editUsers, adminSetUserPassword);
router.patch("/users/:id/status", editUsers, updateUserStatus);
router.get("/profile", protect, getProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-reset-code", resendResetCode);
router.post("/verify-reset-code", verifyResetCode);

export default router;
