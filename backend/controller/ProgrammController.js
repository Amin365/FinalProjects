import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import Clubreq from "../models/Clubreq.js";
import User from "../models/user.js";
import Role from "../models/Role.js";
import mongoose from "mongoose";

const ALLOWED_STATUS = ["active", "inactive", "completed", "draft"];

const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeAssistants = (assistants) => {
  if (!assistants) return [];
  if (Array.isArray(assistants)) {
    return assistants.map(String).map((s) => s.trim()).filter(Boolean);
  }
  return String(assistants)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const isAdminRoleName = (roleName = "") =>
  /super\s*admin/i.test(roleName) || /^admin$/i.test(roleName);

const getRequestRoleName = (req) => {
  const roleSource = req.user?.role;
  if (!roleSource) return "";
  if (typeof roleSource === "object") return String(roleSource.role || roleSource.name || "").toLowerCase();
  return String(roleSource).toLowerCase();
};

const getTeacherMap = async (teacherIds) => {
  const uniqueTeacherIds = [...new Set((teacherIds || []).filter(Boolean).map(String))];
  if (!uniqueTeacherIds.length) return new Map();

  // teacherId is stored as a string in Program and may contain legacy/non-ObjectId values.
  // Never pass invalid ids into a Mongo _id $in query (it throws CastError).
  const validTeacherIds = uniqueTeacherIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (!validTeacherIds.length) return new Map();

  const users = await User.find({ _id: { $in: validTeacherIds } })
    .select("_id first_name last_name username email")
    .lean();

  return new Map(
    users.map((user) => [
      String(user._id),
      {
        _id: user._id,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        email: user.email || "",
        fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || user.email || String(user._id),
      },
    ])
  );
};

const getTeacherFilterForRequest = (req) => {
  const roleName = getRequestRoleName(req);
  if (!req.user?._id || !roleName || isAdminRoleName(roleName)) return null;
  if (roleName === "library staff" || roleName === "teacher" || roleName === "volunteer") {
    return String(req.user._id);
  }
  return "__deny__";
};

const getTeacherRoleIds = async () => {
  const teacherRoles = await Role.find({
    $or: [
      // { role: { $regex: /^library\s*staff$/i } },
      // { plural: { $regex: /^library\s*staff$/i } },
      // { role: { $regex: /^teacher$/i } },
      // { plural: { $regex: /^teachers?$/i } },
      { role: { $regex: /^volunteer$/i } },
      { plural: { $regex: /^volunteers?$/i } },
    ],
  })
    .select("_id")
    .lean();

  return teacherRoles.map((role) => role._id);
};

const getAvailableTeacherUsers = async () => {
  const teacherRoleIds = await getTeacherRoleIds();
  const approvedRequests = await Clubreq.find({ status: "Approved" })
    .select("email FullName userId")
    .lean();

  const approvedEmails = [...new Set(approvedRequests.map((request) => String(request.email || "").trim().toLowerCase()).filter(Boolean))];
  const approvedUserIds = approvedRequests
    .map((request) => String(request.userId || "").trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const teacherUsers = await User.find({
    $or: [
      approvedUserIds.length ? { _id: { $in: approvedUserIds } } : null,
      approvedEmails.length ? { email: { $in: approvedEmails } } : null,
      teacherRoleIds.length ? { role: { $in: teacherRoleIds } } : null,
    ].filter(Boolean),
  })
    .select("_id first_name last_name username email role")
    .lean();

  return teacherUsers.map((user) => ({
    _id: String(user._id),
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    email: user.email || "",
    fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || user.email || String(user._id),
  }));
};

const attachEnrollmentStats = async (programs) => {
  if (!programs.length) return programs;

  const counts = await Enrollment.aggregate([
    {
      $match: {
        programId: { $in: programs.map((program) => String(program._id)) },
        status: { $in: ["confirmed", "waitlisted"] },
      },
    },
    {
      $group: {
        _id: "$programId",
        enrollmentCount: { $sum: 1 },
        confirmedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0],
          },
        },
        waitlistedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "waitlisted"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const countMap = new Map(counts.map((item) => [item._id, item]));

  const teacherMap = await getTeacherMap(programs.map((program) => program.teacherId));

  return programs.map((program) => {
    const stats = countMap.get(String(program._id));
    const confirmedCount = stats?.confirmedCount || 0;
    const waitlistedCount = stats?.waitlistedCount || 0;
    const enrollmentCount = stats?.enrollmentCount || 0;
    const capacity = Number(program.capacity) || 0;
    const teacher = teacherMap.get(String(program.teacherId)) || null;

    return {
      ...program,
      enrollmentCount,
      confirmedCount,
      waitlistedCount,
      availableSeats: Math.max(capacity - confirmedCount, 0),
      teacher,
      teacherName: teacher?.fullName || program.teacherId,
    };
  });
};

export const getAvailableTeachers = async (req, res) => {
  try {
    const teachers = await getAvailableTeacherUsers();
    return res.json({ data: teachers });
  } catch (err) {
    console.error("getAvailableTeachers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createProgram = async (req, res) => {
  try {
    const {
      _id,
      title,
      description = "",
      capacity,
      teacherId,
      assistants = [],
      startDate,
      endDate,
      status = "active",
    } = req.body || {};

    // required validations
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!teacherId || !String(teacherId).trim()) {
      return res.status(400).json({ message: "teacherId is required" });
    }
    const teacherCandidates = await getAvailableTeacherUsers();
    const teacherExists = teacherCandidates.some((teacher) => String(teacher._id) === String(teacherId).trim());
    if (!teacherExists) {
      return res.status(400).json({ message: "teacherId must be an approved teacher account" });
    }

    const cap = Number(capacity);
    if (capacity === undefined || Number.isNaN(cap) || !Number.isFinite(cap) || cap < 1) {
      return res.status(400).json({ message: "capacity must be a number >= 1" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return res.status(400).json({ message: "Invalid startDate or endDate" });
    }
    if (s > e) {
      return res.status(400).json({ message: "startDate must be before or equal to endDate" });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const assistantsArray = normalizeAssistants(assistants);

    const toCreate = {
      title: String(title).trim(),
      description: String(description || "").trim(),
      capacity: Math.floor(cap),
      teacherId: String(teacherId).trim(),
      assistants: assistantsArray,
      startDate: s,
      endDate: e,
      status,
    };

    // allow client-provided string _id but otherwise let schema default generate it
    if (_id && String(_id).trim()) {
      toCreate._id = String(_id).trim();
    }

    const program = await Program.create(toCreate);

    return res.status(201).json({ data: program });
  } catch (err) {
    // handle duplicate key for _id
    if (err.code === 11000) {
      return res.status(409).json({ message: "Program with provided id already exists" });
    }
    console.error("createProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPrograms = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, status } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * perPage;

    const filter = {};
    const teacherScope = req.query.mine === "true" ? getTeacherFilterForRequest(req) : null;
    if (teacherScope === "__deny__") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (teacherScope) {
      filter.$or = [{ teacherId: teacherScope }, { assistants: teacherScope }];
    }
    if (status && ALLOWED_STATUS.includes(status)) filter.status = status;

    if (q?.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [
        { _id: regex },
        { title: regex },
        { description: regex },
        { teacherId: regex },
      ];
    }

    const [items, total] = await Promise.all([
      Program.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      Program.countDocuments(filter),
    ]);

    const enrichedPrograms = await attachEnrollmentStats(items);

    return res.json({
      data: enrichedPrograms,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error("getPrograms error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Program id is required" });

    const program = await Program.findById(id).lean();
    if (!program) return res.status(404).json({ message: "Program not found" });
    const teacherScope = getTeacherFilterForRequest(req);
    if (
      teacherScope === "__deny__" ||
      (teacherScope && String(program.teacherId) !== teacherScope && !(Array.isArray(program.assistants) && program.assistants.includes(teacherScope)))
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [enrichedProgram] = await attachEnrollmentStats([program]);

    return res.json({ data: enrichedProgram });
  } catch (err) {
    console.error("getProgramById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Program id is required" });

    const program = await Program.findById(id);
    if (!program) return res.status(404).json({ message: "Program not found" });
    const teacherScope = getTeacherFilterForRequest(req);
    if (teacherScope === "__deny__" || teacherScope) {
      return res.status(403).json({ message: "Only admin can update programs" });
    }

    const {
      title,
      description,
      capacity,
      teacherId,
      assistants,
      startDate,
      endDate,
      status,
    } = req.body || {};

    if (title !== undefined) program.title = String(title || "").trim();
    if (description !== undefined) program.description = String(description || "").trim();

    if (capacity !== undefined) {
      const cap = Number(capacity);
      if (Number.isNaN(cap) || !Number.isFinite(cap) || cap < 1) {
        return res.status(400).json({ message: "capacity must be a number >= 1" });
      }
      program.capacity = Math.floor(cap);
    }

    if (teacherId !== undefined) {
      if (!teacherId || !String(teacherId).trim()) {
        return res.status(400).json({ message: "teacherId cannot be empty" });
      }
      const teacherCandidates = await getAvailableTeacherUsers();
      const teacherExists = teacherCandidates.some((teacher) => String(teacher._id) === String(teacherId).trim());
      if (!teacherExists) {
        return res.status(400).json({ message: "teacherId must be an approved teacher account" });
      }
      program.teacherId = String(teacherId).trim();
    }

    if (assistants !== undefined) {
      program.assistants = normalizeAssistants(assistants);
    }

    if (startDate !== undefined) {
      const ds = new Date(startDate);
      if (Number.isNaN(ds.getTime())) return res.status(400).json({ message: "Invalid startDate" });
      program.startDate = ds;
    }

    if (endDate !== undefined) {
      const de = new Date(endDate);
      if (Number.isNaN(de.getTime())) return res.status(400).json({ message: "Invalid endDate" });
      program.endDate = de;
    }

    // validate date ordering (schema also has pre("validate") but double-check here)
    if (program.startDate && program.endDate && program.startDate > program.endDate) {
      return res.status(400).json({ message: "startDate must be before or equal to endDate" });
    }

    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      program.status = status;
    }

    await program.save();

    return res.json({ data: program });
  } catch (err) {
   
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate key error" });
    }
    console.error("updateProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Program id is required" });

    const teacherScope = getTeacherFilterForRequest(req);
    if (teacherScope === "__deny__" || teacherScope) {
      return res.status(403).json({ message: "Only admin can delete programs" });
    }

    const deleted = await Program.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ message: "Program not found" });

    return res.json({ success: true, message: "Program deleted" });
  } catch (err) {
    console.error("deleteProgram error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
