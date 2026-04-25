
import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import mongoose from "mongoose";
import fs from "fs";

// Helper: count confirmed enrollments
const countConfirmed = async (programId) =>
  Enrollment.countDocuments({ programId, status: "confirmed" });

// Helper: promote first waitlisted -> confirmed (ordered by createdAt)
const promoteFromWaitlist = async (programId) => {
  const waitlisted = await Enrollment.findOne({ programId, status: "waitlisted" }).sort({ createdAt: 1 });
  if (!waitlisted) return null;
  waitlisted.status = "confirmed";
  await waitlisted.save();
  return waitlisted;
};

// Create enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { id: programId } = req.params;
    // userId should come from authenticated session ideally
    // but allow in body as fallback
    const userId = req.user?.id || req.body?.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: "Program not found" });

    // require published programs to be enrollable
    if (program.published !== true) {
      return res.status(403).json({ message: "Program is not published for enrollment" });
    }

    // Prevent duplicate (non-cancelled) enrollment
    const existing = await Enrollment.findOne({
      programId,
      userId,
      status: { $in: ["confirmed", "waitlisted"] },
    });
    if (existing) {
      return res.status(409).json({ message: "User already enrolled or waitlisted for this program", data: existing });
    }

    // Normalize formData if provided
    const formData = req.body.formData || {};

    // Handle optional attachment if multer populated req.file
    let attachment;
    if (req.file) {
      // In production store file in object storage and set URL accordingly
      attachment = {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    }

    // Determine status: confirmed if capacity not reached, else waitlisted
    const confirmedCount = await countConfirmed(programId);
    const capacity = Number(program.capacity) || 0;
    const status = confirmedCount < capacity ? "confirmed" : "waitlisted";

    const enrollment = await Enrollment.create({
      programId,
      userId,
      status,
      attachment,
      formData,
    });

    return res.status(201).json({ data: enrollment });
  } catch (err) {
    console.error("createEnrollment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// List enrollments for a program (admin-protected)
export const getEnrollmentsForProgram = async (req, res) => {
  try {
    const { id: programId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * perPage;

    const filter = { programId };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Enrollment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      Enrollment.countDocuments(filter),
    ]);

    return res.json({ data: items, total, page: pageNum, limit: perPage, totalPages: Math.ceil(total / perPage) });
  } catch (err) {
    console.error("getEnrollmentsForProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// List user's enrollments
export const getEnrollmentsForUser = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const enrollments = await Enrollment.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ data: enrollments });
  } catch (err) {
    console.error("getEnrollmentsForUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Cancel an enrollment (user or admin)
export const cancelEnrollment = async (req, res) => {
  try {
    const { id } = req.params; // enrollment id
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    if (enrollment.status === "cancelled") {
      return res.status(400).json({ message: "Enrollment already cancelled" });
    }

    const wasConfirmed = enrollment.status === "confirmed";
    enrollment.status = "cancelled";
    await enrollment.save();

    // If cancelled a confirmed slot, promote from waitlist
    let promoted = null;
    if (wasConfirmed) {
      promoted = await promoteFromWaitlist(enrollment.programId);
    }

    return res.json({ data: enrollment, promoted });
  } catch (err) {
    console.error("cancelEnrollment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};