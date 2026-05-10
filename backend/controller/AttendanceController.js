import Attendance from "../models/Attendance.js";
import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/user.js";
import Member from "../models/Members.js";
import mongoose from "mongoose";

const getRoleName = async (userId) => {
  const user = await User.findById(userId).populate("role", "role plural").lean();
  if (!user) return "";
  return String(user.role?.role || user.role?.plural || "").toLowerCase();
};

const isTeacherRole = (roleName = "") => /^(teacher|volunteer)$/.test(roleName);

const firstNonEmpty = (...values) =>
  values.map((value) => String(value ?? "").trim()).find(Boolean) || "";

const getFormValue = (formData = {}, keys = []) => {
  for (const key of keys) {
    const value = formData?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
};

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

  const userIds = [
    ...new Set(
      enrollments
        .map((item) => String(item.userId || ""))
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    ),
  ];
  const enrollmentEmails = [
    ...new Set(
      enrollments
        .flatMap((item) => {
          const formData = item.formData || {};
          return [
            getFormValue(formData, ["email", "Email", "learnerEmail", "studentEmail"]),
            String(item.userId || "").includes("@") ? String(item.userId).trim() : "",
          ];
        })
        .map((email) => String(email || "").trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  const userQuery = [
    userIds.length ? { _id: { $in: userIds } } : null,
    enrollmentEmails.length ? { email: { $in: enrollmentEmails } } : null,
  ].filter(Boolean);

  const [users, members] = await Promise.all([
    userQuery.length
      ? User.find({ $or: userQuery })
        .select("_id first_name last_name email profile_picture member member_id")
        .populate("member", "first_name middle_name last_name email phone Profile_picture code")
        .lean()
      : [],
    enrollmentEmails.length
      ? Member.find({ email: { $in: enrollmentEmails } })
          .select("_id first_name middle_name last_name email phone Profile_picture code")
          .lean()
      : [],
  ]);

  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const userEmailMap = new Map(users.map((user) => [String(user.email || "").trim().toLowerCase(), user]));
  const memberEmailMap = new Map(members.map((member) => [String(member.email || "").trim().toLowerCase(), member]));

  return enrollments.map((item) => {
    const formData = item.formData || {};
    const formEmail = getFormValue(formData, ["email", "Email", "learnerEmail", "studentEmail"]).toLowerCase();
    const userIdEmail = String(item.userId || "").includes("@") ? String(item.userId).trim().toLowerCase() : "";
    const lookupEmail = formEmail || userIdEmail;
    const user = userMap.get(String(item.userId)) || userEmailMap.get(lookupEmail);
    const member =
      (user?.member && typeof user.member === "object" ? user.member : null) ||
      memberEmailMap.get(lookupEmail) ||
      null;
    const firstName = firstNonEmpty(
      user?.first_name,
      member?.first_name,
      getFormValue(formData, ["firstName", "first_name", "firstname", "FirstName", "first name"])
    );
    const lastName = firstNonEmpty(
      user?.last_name,
      member?.last_name,
      getFormValue(formData, ["lastName", "last_name", "lastname", "LastName", "last name"])
    );
    const fullName = [
      firstName,
      lastName,
    ].filter(Boolean).join(" ").trim();
    const fallbackName =
      getFormValue(formData, ["fullName", "full_name", "name", "FullName", "full name", "learnerName", "studentName"]) ||
      [member?.first_name, member?.middle_name, member?.last_name].filter(Boolean).join(" ").trim();

    return {
      id: String(item._id),
      studentId: String(item._id),
      userId: String(item.userId || ""),
      name: fullName || fallbackName || user?.email || member?.email || lookupEmail || `Enrollment ${String(item._id).slice(-6)}`,
      email: user?.email || member?.email || lookupEmail,
      phone: member?.phone || getFormValue(formData, ["phone", "Phone", "telephone", "mobile"]) || "",
      profilePicture: user?.profile_picture || member?.Profile_picture || "",
      enrollmentStatus: item.status,
    };
  });
};

const enrichAttendanceRecord = (record, studentMap) => {
  const studentId = String(record?.studentId || "");
  const student = studentMap.get(studentId);
  if (!student) return record;

  return {
    ...record,
    studentId,
    name: record?.name && record.name !== "Unknown learner" ? record.name : student.name,
    email: record?.email || student.email,
  };
};

const enrichAttendance = (attendance, students) => {
  if (!attendance) return attendance;
  const studentMap = new Map(students.map((student) => [String(student.studentId || student.id), student]));
  return {
    ...attendance,
    records: Array.isArray(attendance.records)
      ? attendance.records.map((record) => enrichAttendanceRecord(record, studentMap))
      : [],
  };
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
    const programIds = programs.map((program) => String(program._id));
    const enrollmentCounts = programIds.length
      ? await Enrollment.aggregate([
          { $match: { programId: { $in: programIds }, status: "confirmed" } },
          { $group: { _id: "$programId", count: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(enrollmentCounts.map((item) => [String(item._id), Number(item.count || 0)]));

    return res.json({
      data: programs.map((program) => ({
        ...program,
        attendanceLearnerCount: countMap.get(String(program._id)) || 0,
      })),
    });
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

    return res.json({ data: { program: access.program, students, attendance: enrichAttendance(attendance, students) } });
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

    const students = await buildStudentList(programId);
    const studentMap = new Map(students.map((student) => [String(student.studentId || student.id), student]));

    const normalizedRecords = Array.isArray(records)
      ? records.map((item) => {
          const studentId = String(item.studentId || item.id || "");
          const student = studentMap.get(studentId);
          return {
            studentId,
            status: ["present", "absent", "late", "excused"].includes(item.status) ? item.status : "absent",
            name: String(student?.name || item.name || ""),
            email: String(student?.email || item.email || ""),
          };
        })
        .filter((item) => item.studentId)
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

    const students = await buildStudentList(programId);
    const history = await Attendance.find({ programId: String(programId) })
      .sort({ date: -1 })
      .lean();

    return res.json({ data: history.map((attendance) => enrichAttendance(attendance, students)) });
  } catch (err) {
    console.error("getAttendanceHistory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
