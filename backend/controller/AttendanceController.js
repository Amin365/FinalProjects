import Attendance from "../models/Attendance.js";
import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/user.js";
import mongoose from "mongoose";

const getRoleName = async (userId) => {
  const user = await User.findById(userId).populate("role", "role plural").lean();
  if (!user) return "";
  return String(user.role?.role || user.role?.plural || "").toLowerCase();
};

const isTeacherRole = (roleName = "") => /^(teacher|volunteer)$/.test(roleName);

const ensureProgramAccess = async (userId, programId) => {
  const roleName = await getRoleName(userId);
  const program = await Program.findById(programId).lean();
  if (!program) return { allowed: false, reason: "Program not found", status: 404 };

  if (/super\s*admin/i.test(roleName) || /^admin$/i.test(roleName)) {
    return { allowed: true, program };
  }
  if (
    (roleName === "library staff" || isTeacherRole(roleName)) &&
    (String(program.teacherId) === String(userId) || (Array.isArray(program.assistants) && program.assistants.includes(String(userId))))
  ) {
    return { allowed: true, program };
  }
  return { allowed: false, reason: "Forbidden", status: 403 };
};

const buildStudentList = async (programId) => {
  const enrollments = await Enrollment.find({
    programId: String(programId),
    status: { $in: ["confirmed"] },
  })
    .sort({ createdAt: 1 })
    .lean();

  return enrollments.map((item) => {
    const formData = item.formData || {};
    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim();
    return {
      id: String(item._id),
      studentId: String(item._id),
      name: fullName || formData.fullName || "Unknown learner",
      email: formData.email || "",
    };
  });
};

export const getAttendancePrograms = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleName = await getRoleName(userId);
    const filter = {};
    if (roleName === "library staff" || isTeacherRole(roleName)) {
      filter.$or = [{ teacherId: String(userId) }, { assistants: String(userId) }];
    }

    const programs = await Program.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ data: programs });
  } catch (err) {
    console.error("getAttendancePrograms error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAttendanceByProgramAndDate = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id: programId } = req.params;
    const { date } = req.query;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const access = await ensureProgramAccess(userId, programId);
    if (!access.allowed) return res.status(access.status).json({ message: access.reason });

    const students = await buildStudentList(programId);
    const attendance = date
      ? await Attendance.findOne({ programId: String(programId), date: String(date) }).lean()
      : null;

    return res.json({ data: { program: access.program, students, attendance } });
  } catch (err) {
    console.error("getAttendanceByProgramAndDate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const saveAttendance = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id: programId } = req.params;
    const { date, records = [] } = req.body || {};
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!date) return res.status(400).json({ message: "date is required" });

    const access = await ensureProgramAccess(userId, programId);
    if (!access.allowed) return res.status(access.status).json({ message: access.reason });

    const normalizedRecords = Array.isArray(records)
      ? records.map((item) => ({
          studentId: String(item.studentId || item.id || ""),
          status: ["present", "absent", "late", "excused"].includes(item.status) ? item.status : "absent",
          name: String(item.name || ""),
          email: String(item.email || ""),
        }))
      : [];

    const attendance = await Attendance.findOneAndUpdate(
      { programId: String(programId), date: String(date) },
      {
        $set: {
          markedBy: userId,
          records: normalizedRecords,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ data: attendance });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Attendance already exists for this date" });
    }
    console.error("saveAttendance error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id: programId } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const access = await ensureProgramAccess(userId, programId);
    if (!access.allowed) return res.status(access.status).json({ message: access.reason });

    const history = await Attendance.find({ programId: String(programId) })
      .sort({ date: -1 })
      .lean();

    return res.json({ data: history });
  } catch (err) {
    console.error("getAttendanceHistory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
