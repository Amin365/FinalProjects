
import express from "express";
import multer from "multer";
import {
  createEnrollment,
  getEnrollmentsForProgram,
  getEnrollmentsForUser,
  cancelEnrollment,
} from "../controller/enrollmentController.js";

const router = express.Router();

// multer simple disk storage (change to S3 in prod)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /programs/:id/enroll  (multipart/form-data, optional file field "attachment")
router.post("/programs/:id/enroll", upload.single("attachment"), createEnrollment);

// GET /programs/:id/enrollments  (admin)
router.get("/programs/:id/enrollments", getEnrollmentsForProgram);

// GET /users/:userId/enrollments  or GET /me/enrollments (if you set req.user)
router.get("/users/:userId/enrollments", getEnrollmentsForUser);

// POST /enrollments/:id/cancel
router.post("/enrollments/:id/cancel", cancelEnrollment);

export default router;