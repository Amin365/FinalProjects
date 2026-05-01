import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/user.js";
import Member from "../models/Members.js";
import Role from "../models/Role.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { sendMail } from "./EmailController.js";
import { welcomeEmailTemplate, joinRejectionTemplate } from "../utility/emailTemplates.js";

const getRequestRoleName = (req) => {
  const roleSource = req.user?.role;
  if (!roleSource) return "";
  if (typeof roleSource === "object") return String(roleSource.role || roleSource.name || "").toLowerCase();
  return String(roleSource).toLowerCase();
};

const getTeacherScopeForRequest = (req) => {
  const roleName = getRequestRoleName(req);
  // If there is no authenticated user, we don't scope (public request)
  if (!req.user?._id) return null;
  // If authenticated but no role is present, deny by default
  if (!roleName) return "__deny__";
  if (/super\s*admin/i.test(roleName) || /^admin$/i.test(roleName)) return null;
  if (roleName === "library staff" || roleName === "teacher" || roleName === "volunteer") return String(req.user._id);
  return "__deny__";
};

const isAdminRequest = (req) => {
  const scope = getTeacherScopeForRequest(req);
  return scope === null;
};

const ensureAdmin = (req, res) => {
  if (!req.user?._id) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  if (!isAdminRequest(req)) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
};

const pickGuestEmail = (formData, reqBody) => {
  const email = String(formData?.email || reqBody?.email || "").trim().toLowerCase();
  return email;
};

const generateUniqueUsername = async ({ firstName, lastName, email }) => {
  const baseFromName = `${String(firstName || "").trim()}_${String(lastName || "").trim()}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "");
  const baseFromEmail = String(email || "").split("@")[0]
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "");
  const base = baseFromName || baseFromEmail || `user${Date.now().toString().slice(-6)}`;

  let username = base;
  let tries = 0;
  // keep it bounded
  while (tries < 6) {
    const existing = await User.findOne({ username }).select("_id").lean().exec();
    if (!existing) return username;
    tries += 1;
    username = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
};

const getStudentRoleId = async () => {
  const role = await Role.findOne({ role: { $regex: /^student$/i } }).select("_id").lean();
  return role?._id || null;
};

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

const buildGuestUserFallback = (item) => {
  const formData = item?.formData || {};
  return {
    _id: String(item.userId || ""),
    first_name: formData.firstName || formData.fullName || "",
    last_name: formData.lastName || "",
    email: formData.email || String(item.userId || ""),
    phone: formData.phone || "",
    country: formData.country || "",
    dob: formData.dob || "",
    gender: formData.gender || "",
    profile_picture: "",
    isGuest: true,
  };
};

const hydrateEnrollments = async (items) => {
  const programIds = [...new Set(items.map((item) => item.programId).filter(Boolean))];
  const userIds = [...new Set(items.map((item) => item.userId).filter(Boolean))];
  const objectIdUserIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  const [programs, users] = await Promise.all([
    Program.find({ _id: { $in: programIds } }).lean(),
    objectIdUserIds.length
      ? User.find({ _id: { $in: objectIdUserIds } })
          .select("_id first_name last_name email profile_picture")
          .lean()
      : [],
  ]);

  const programMap = new Map(programs.map((program) => [String(program._id), program]));
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return items.map((item) => ({
    ...item,
    programId: programMap.get(String(item.programId)) || item.programId,
    userId: userMap.get(String(item.userId)) || buildGuestUserFallback(item),
    enrolledAt: item.createdAt,
  }));
};

// Create enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { id: programId } = req.params;
    const formData = req.body.formData || {};

    const isAuthenticated = Boolean(req.user?._id || req.user?.id);
    const guestEmail = pickGuestEmail(formData, req.body);
    const userId = isAuthenticated ? (req.user?._id || req.user?.id) : (req.body?.userId || guestEmail);
    if (!userId) return res.status(400).json({ message: "userId is required" });

    if (!isAuthenticated) {
      if (!guestEmail) return res.status(400).json({ message: "Email is required" });
      if (!String(formData.firstName || "").trim() || !String(formData.lastName || "").trim()) {
        return res.status(400).json({ message: "First name and last name are required" });
      }
    }

    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).json({ message: "Program not found" });

    if (program.status !== "active") {
      return res.status(403).json({ message: "Only active programs can accept enrollments" });
    }

    // Prevent duplicate (non-cancelled) enrollment
    const existing = await Enrollment.findOne({
      programId,
      userId,
      status: { $in: ["pending", "confirmed", "waitlisted"] },
    });
    if (existing) {
      return res.status(409).json({ message: "User already enrolled or waitlisted for this program", data: existing });
    }

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

    // Determine status:
    // - Authenticated dashboard user: confirmed if capacity not reached, else waitlisted.
    // - Public/guest: pending (admin must approve/reject).
    let status = "pending";
    if (isAuthenticated) {
      const confirmedCount = await countConfirmed(programId);
      const capacity = Number(program.capacity) || 0;
      status = confirmedCount < capacity ? "confirmed" : "waitlisted";
    }

    const enrollment = await Enrollment.create({
      programId,
      userId: String(userId),
      status,
      attachment,
      formData,
    });

    const [hydratedEnrollment] = await hydrateEnrollments([enrollment.toObject()]);

    return res.status(201).json({ data: hydratedEnrollment });
  } catch (err) {
    console.error("createEnrollment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: approve a pending enrollment.
// If enrollment belongs to a guest (userId is email), create a Member+User and send setup-password welcome email.
export const approveEnrollment = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    if (enrollment.status !== "pending") {
      return res.status(400).json({ message: `Only pending enrollments can be approved (current: ${enrollment.status})` });
    }

    const program = await Program.findById(enrollment.programId).lean();
    if (!program) return res.status(404).json({ message: "Program not found" });

    const formData = enrollment.formData || {};
    const email = pickGuestEmail(formData, formData) || String(enrollment.userId || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Enrollment email is missing" });

    let user = await User.findOne({ email }).lean();
    let userCreated = false;

    if (!user) {
      const studentRoleId = await getStudentRoleId();
      if (!studentRoleId) {
        return res.status(500).json({ message: "Student role not found. Please seed/create a Role with role='student' before approving enrollments." });
      }

      // find or create member
      let member = await Member.findOne({ email }).lean();
      if (!member) {
        member = await Member.create({
          first_name: String(formData.firstName || "").trim(),
          last_name: String(formData.lastName || "").trim(),
          email,
          phone: String(formData.phone || "").trim(),
          gender: (String(formData.gender || "").trim() === "Female") ? "Female" : "Male",
          status: "pending",
          role: studentRoleId,
        });
        member = member.toObject();
      }

      const username = await generateUniqueUsername({
        firstName: member.first_name,
        lastName: member.last_name,
        email,
      });

      const securePassword = crypto.randomBytes(32).toString("hex");
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const inviteTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const created = await User.create({
        first_name: member.first_name,
        middle_name: "",
        last_name: member.last_name,
        username,
        email,
        password: securePassword,
        member_id: member.code || String(member._id),
        role: studentRoleId,
        status: "pending",
        member: member._id,
        added_by: req.user?._id || null,
        updated_by: req.user?._id || null,
        mustChangePassword: true,
        inviteToken,
        inviteTokenExpires,
        invitedBy: req.user?._id || null,
        invitedAt: new Date(),
      });

      user = created.toObject();
      userCreated = true;

      const appUrl = process.env.APP_URL || "http://localhost:5173";
      const setupUrl = `${appUrl}/setup-password?token=${inviteToken}`;
      const welcomeEmail = welcomeEmailTemplate({
        firstName: member.first_name,
        lastName: member.last_name,
        memberCode: member.code,
        username,
        setupUrl,
      });

      try {
        await sendMail({
          to: email,
          subject: welcomeEmail.subject,
          text: welcomeEmail.text,
          html: welcomeEmail.html,
        });
      } catch (emailErr) {
        console.error("approveEnrollment: failed to send welcome email:", emailErr?.message || emailErr);
      }
    }

    // If user exists but has no role, ensure they can access student dashboard
    if (user && !userCreated && !user.role) {
      const studentRoleId = await getStudentRoleId();
      if (studentRoleId) {
        await User.updateOne({ _id: user._id }, { $set: { role: studentRoleId } }).exec();
        user = { ...user, role: studentRoleId };
      }
    }

    // Decide confirmed/waitlisted at approval time
    const confirmedCount = await countConfirmed(enrollment.programId);
    const capacity = Number(program.capacity) || 0;
    enrollment.status = confirmedCount < capacity ? "confirmed" : "waitlisted";
    enrollment.userId = String(user._id);
    await enrollment.save();

    const [hydratedEnrollment] = await hydrateEnrollments([enrollment.toObject()]);
    return res.json({ data: hydratedEnrollment, userCreated });
  } catch (err) {
    console.error("approveEnrollment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin: reject a pending enrollment.
export const rejectEnrollment = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    const { reason } = req.body || {};

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    if (enrollment.status !== "pending") {
      return res.status(400).json({ message: `Only pending enrollments can be rejected (current: ${enrollment.status})` });
    }

    enrollment.status = "rejected";
    if (typeof reason === "string" && reason.trim()) {
      enrollment.note = reason.trim();
    }
    await enrollment.save();

    const formData = enrollment.formData || {};
    const email = pickGuestEmail(formData, formData) || String(enrollment.userId || "").trim().toLowerCase();
    if (email) {
      const rej = joinRejectionTemplate({
        firstName: String(formData.firstName || "").trim(),
        lastName: String(formData.lastName || "").trim(),
        reason: typeof reason === "string" ? reason.trim() : "",
      });
      try {
        await sendMail({ to: email, subject: rej.subject, text: rej.text, html: rej.html });
      } catch (emailErr) {
        console.error("rejectEnrollment: failed to send rejection email:", emailErr?.message || emailErr);
      }
    }

    const [hydratedEnrollment] = await hydrateEnrollments([enrollment.toObject()]);
    return res.json({ data: hydratedEnrollment });
  } catch (err) {
    console.error("rejectEnrollment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, q } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPage = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * perPage;

    const filter = {};
    if (status) filter.status = status;

    const teacherScope = req.query.mine === "true" ? getTeacherScopeForRequest(req) : null;
    if (teacherScope === "__deny__") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (teacherScope) {
      const teacherPrograms = await Program.find({ $or: [{ teacherId: teacherScope }, { assistants: teacherScope }] })
        .select("_id")
        .lean();
      filter.programId = { $in: teacherPrograms.map((program) => String(program._id)) };
    }

    const [items, total] = await Promise.all([
      Enrollment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
      Enrollment.countDocuments(filter),
    ]);

    const normalizedQuery = String(q || "").trim().toLowerCase();
    const hydratedItems = (await hydrateEnrollments(items))
      .filter((item) => {
        if (!normalizedQuery) return true;

        const programTitle =
          typeof item.programId === "object" ? item.programId?.title : item.programId;
        const userName =
          typeof item.userId === "object"
            ? `${item.userId?.first_name || ""} ${item.userId?.last_name || ""} ${item.userId?.email || ""}`
            : item.userId;

        return [programTitle, userName, item.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });

    return res.json({
      data: hydratedItems,
      total: normalizedQuery ? hydratedItems.length : total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil((normalizedQuery ? hydratedItems.length : total) / perPage),
    });
  } catch (err) {
    console.error("getAllEnrollments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id).lean();

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const teacherScope = getTeacherScopeForRequest(req);
    if (teacherScope === "__deny__") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (teacherScope) {
      const program = await Program.findById(enrollment.programId).select("teacherId assistants").lean();
      if (!program || (String(program.teacherId) !== teacherScope && !(Array.isArray(program.assistants) && program.assistants.includes(teacherScope)))) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const [hydratedEnrollment] = await hydrateEnrollments([enrollment]);
    return res.json({ data: hydratedEnrollment });
  } catch (err) {
    console.error("getEnrollmentById error:", err);
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
    const userId = req.user?._id || req.user?.id || req.params.userId || req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const enrollments = await Enrollment.find({ userId: String(userId) }).sort({ createdAt: -1 }).lean();
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

export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherScope = getTeacherScopeForRequest(req);
    if (teacherScope === "__deny__" || teacherScope) {
      return res.status(403).json({ message: "Only admin can delete enrollments" });
    }

    const deleted = await Enrollment.findByIdAndDelete(id).lean();

    if (!deleted) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    return res.json({ success: true, data: deleted });
  } catch (err) {
    console.error("deleteEnrollment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
