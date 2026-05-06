
import express from "express";
import multer from "multer";
import {
  createEnrollment,
  approveEnrollment,
  rejectEnrollment,
  deleteEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  getEnrollmentsForProgram,
  getEnrollmentsForUser,
  cancelEnrollment,
} from "../controller/enrollmentController.js";
import { protect, optionalProtect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";

const router = express.Router();

const viewEnrollments = [protect, requirePermission("View Enrollments")];
const manageEnrollments = [protect, requirePermission("Manage Enrollments")];

// multer simple disk storage (change to S3 in prod)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /programs/:id/enroll  (multipart/form-data, optional file field "attachment")
// Public route, but will attach req.user if Authorization token is provided.
router.post("/programs/:id/enroll", optionalProtect, upload.single("attachment"), createEnrollment);

// GET /enrollments
router.get("/enrollments", viewEnrollments, getAllEnrollments);
router.get("/enrollments/:id", viewEnrollments, getEnrollmentById);

// Admin decision endpoints
router.post("/enrollments/:id/approve", manageEnrollments, approveEnrollment);
router.post("/enrollments/:id/reject", manageEnrollments, rejectEnrollment);

// GET /programs/:id/enrollments  (admin)
router.get("/programs/:id/enrollments", viewEnrollments, getEnrollmentsForProgram);

// GET /users/:userId/enrollments  or GET /me/enrollments (if you set req.user)
router.get("/users/:userId/enrollments", viewEnrollments, getEnrollmentsForUser);

// POST /enrollments/:id/cancel
router.post("/enrollments/:id/cancel", cancelEnrollment);
router.delete("/enrollments/:id", manageEnrollments, deleteEnrollment);

export default router;
