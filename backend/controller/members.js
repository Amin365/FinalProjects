import mongoose from "mongoose";
import crypto from "crypto";
import Member from "../models/Members.js"; 
import Role from "../models/Role.js";
import User from '../models/user.js';
import Clubreq from "../models/Clubreq.js";
import Notification from "../models/Notification.js";
import Issue from "../models/Issue.js";
import MemberNote from "../models/MemberNote.js";
import { logMemberAction, logUserAction, logJoinRequestAction } from "../utility/auditLog.js";
import { sendMail, buildEmailHtml } from "./EmailController.js";
import { joinApprovalTemplate, joinRejectionTemplate, welcomeEmailTemplate } from "../utility/emailTemplates.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function findDefaultMemberRole() {
  return Role.findOne({
    $or: [
      { role: { $regex: /^members?$/i } },
      { plural: { $regex: /^members?$/i } },
    ],
  })
    .select("_id role plural")
    .lean()
    .exec();
}

async function findTeacherRole() {
  return Role.findOne({
    $or: [
      // { role: { $regex: /^library\s*staff$/i } },
      // { plural: { $regex: /^library\s*staff$/i } },
      { role: { $regex: /^teacher$/i } },
      { plural: { $regex: /^teachers?$/i } },
    ],
  })
    .select("_id role plural")
    .lean()
    .exec();
}

/**
 * Create a new member
 * POST /members
 * Body: { first_name, middle_name, last_name, code?, phone?, email?, date_of_birth?, gender?, region?, join_date? }
 * Response: { data: member }
 */

export const createMember = async (req, res, next) => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      code,
      phone,
      email,
      // date_of_birth,
      gender,
      region,
      join_date,
      department,
      student_id,
      study_year,
      role, //  ADD THIS
      Profile_picture
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ message: "first_name and last_name are required" });
    }

    if (!email) {
      return res.status(400).json({ message: "email is required to create a user automatically" });
    }

    //  Validate role if provided
    if (role) {
      if (!mongoose.Types.ObjectId.isValid(role)) {
        return res.status(400).json({ message: "Invalid role id" });
      }
      const roleExists = await Role.exists({ _id: role });
      if (!roleExists) {
        return res.status(400).json({ message: "Role not found" });
      }
    }

    // Prevent duplicate user email before creating member
    const existingUserByEmail = await User.findOne({ email }).lean().exec();
    if (existingUserByEmail) {
      return res.status(409).json({ message: "Email already exists for another user" });
    }

    const member = new Member({
      first_name,
      middle_name,
      last_name,
      code,
      phone,
      email,
      // date_of_birth,
      gender,
      region,
      join_date,
      department,
      student_id,
      study_year,
      Profile_picture: req.file ? req.file.path : null,
      role: role || null, //  SAVE ROLE
    });

    try {
      const saved = await member.save();

      // Create user with secure invite-based onboarding (Phase 8)
      // Generate a secure random password and invite token
      const baseUsername = String(saved.email || `${saved.first_name}${saved.last_name}`)
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9._-]/gi, "");

      let username = baseUsername || `user${String(saved._id).slice(-4)}`;
      const existingUsername = await User.findOne({ username }).lean().exec();
      if (existingUsername) {
        username = `${username}-${String(saved._id).slice(-4)}`;
      }

      // Generate secure random password (user won't know this - they must reset)
      const securePassword = crypto.randomBytes(32).toString("hex");
      
      // Generate invite token for password setup
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const inviteTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

      try {
        const newUser = await User.create({
          first_name: saved.first_name,
          middle_name: saved.middle_name || "",
          last_name: saved.last_name,
          username,
          email: saved.email,
          password: securePassword,
          member_id: saved.code || String(saved._id),
          role: saved.role || null,
          status: "pending", // User must set password before becoming active
          member: saved._id,
          added_by: req.user?._id || null,
          updated_by: req.user?._id || null,
          mustChangePassword: true,
          inviteToken,
          inviteTokenExpires,
          invitedBy: req.user?._id || null,
          invitedAt: new Date(),
        });

        // Send invite email with password setup link
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const setupUrl = `${appUrl}/setup-password?token=${inviteToken}`;

        try {
          const welcomeEmail = welcomeEmailTemplate({
            firstName: saved.first_name,
            lastName: saved.last_name,
            memberCode: saved.code || String(saved._id),
            username,
            setupUrl,
          });

          await sendMail({
            to: saved.email,
            subject: welcomeEmail.subject,
            text: welcomeEmail.text,
            html: welcomeEmail.html,
          });
        } catch (emailErr) {
          console.error("Failed to send invite email:", emailErr.message);
          // Don't fail the operation if email fails
        }

        // Audit log
        await logMemberAction("created", saved, req.user, req, {
          description: `Member "${saved.first_name} ${saved.last_name}" was created`,
        });
        await logUserAction("invited", newUser, req.user, req, {
          description: `User account created with invite for ${saved.email}`,
        });
      } catch (userErr) {
        // rollback member if user creation fails
        await Member.findByIdAndDelete(saved._id).exec();
        return res.status(500).json({ message: "Member created but user creation failed" });
      }

      // optional: return populated role for UI
      const populated = await Member.findById(saved._id).populate("role").lean();

      return res.status(201).json({ data: populated });
    } catch (err) {
      if (err && err.code === 11000) {
        const dupField = Object.keys(err.keyValue || {}).join(", ") || "unique field";
        return res.status(409).json({
          message: `Duplicate ${dupField}: a member with this value already exists.`,
          details: err.keyValue || null,
        });
      }
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "-createdAt",
      q,
      region,
      city,
      gender,
      isArchived,
      from,
      to,
      department,
      study_year,
      status,
    } = req.query;

    const filter = {};

    if (q) {
      const re = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { first_name: re },
        { middle_name: re },
        { last_name: re },
        { email: re },
        { phone: re },
        { code: re },
      ];
    }

    if (region) filter.region = region;
    if (city) filter.city = city;
    if (gender) filter.gender = gender;
    if (department) filter.department = new RegExp(escapeRegex(department), "i");
    if (study_year) filter.study_year = study_year;
    if (status && ["Active", "Inactive", "pending"].includes(status)) filter.status = status;

    if (typeof isArchived !== "undefined") {
      if (isArchived === "true" || isArchived === "1") filter.isArchived = true;
      else if (isArchived === "false" || isArchived === "0") filter.isArchived = false;
    }

    if (from || to) {
      filter.join_date = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) filter.join_date.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) filter.join_date.$lte = d;
      }
      if (Object.keys(filter.join_date).length === 0) delete filter.join_date;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(500, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    // Explicitly select the fields you want returned.
    const selectFields = [
      "first_name",
      "middle_name",
      "last_name",
      "email",
      "phone",
      "code",
      "region",
      "city",
      "gender",
      "join_date",
      "Profile_picture",
      "department",
      "student_id",
      "study_year",
      "status",
      "createdAt",
      "_id",
    ].join(" ");

    const [items, total] = await Promise.all([
      Member.find(filter)
        .select(selectFields)
        .populate("role", "role color plural system")
        .sort(sort)
        .skip(skip)
        .limit(perPage)
        .lean()
        .exec(),
      Member.countDocuments(filter).exec(),
    ]);

    const mapped = items.map((it) => ({
      ...it,
      join_date: it.join_date ? new Date(it.join_date).toISOString() : null,
      profile_picture: it.Profile_picture ?? null,
    }));

    return res.status(200).json({
      data: mapped,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    return next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const update = { ...req.body };
    if (req.file) {
      update.Profile_picture = req.file.path;
    }
    if (update._id) delete update._id;

    if (Object.prototype.hasOwnProperty.call(update, "role")) {
      if (update.role) {
        if (!mongoose.Types.ObjectId.isValid(update.role)) {
          return res.status(400).json({ message: "Invalid role id" });
        }
        const roleExists = await Role.exists({ _id: update.role });
        if (!roleExists) {
          return res.status(400).json({ message: "Role not found" });
        }
      } else {
        update.role = null;
      }
    }

    try {
      const updated = await Member.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
        context: "query",
      })
        .populate("role")
        .lean()
        .exec();

      if (!updated) return res.status(404).json({ message: "Member not found" });
      return res.status(200).json({ data: updated });
    } catch (err) {
      if (err && err.code === 11000) {
        const dupField = Object.keys(err.keyValue || {}).join(", ") || "unique field";
        return res.status(409).json({
          message: `Duplicate ${dupField}: a member with this value already exists.`,
          details: err.keyValue || null,
        });
      }
      return next(err);
    }
  } catch (err) {
    return next(err);
  }
};

export const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const member = await Member.findById(id)
      .populate("role", "role color plural system")
      .lean()
      .exec();

    if (!member) return res.status(404).json({ message: "Member not found" });
    return res.status(200).json({ data: member });
  } catch (err) {
    return next(err);
  }
};

/**
 * Soft-archive a member (mark isArchived = true)
 * POST /members/:id/archive
 */
export const archiveMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const updated = await Member.findByIdAndUpdate(
      id,
      { isArchived: true },
      { new: true, runValidators: true, context: "query" }
    ).lean().exec();

    if (!updated) return res.status(404).json({ message: "Member not found" });
    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * Restore archived member (isArchived = false)
 * POST /members/:id/restore
 */
export const restoreMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const updated = await Member.findByIdAndUpdate(
      id,
      { isArchived: false },
      { new: true, runValidators: true, context: "query" }
    ).lean().exec();

    if (!updated) return res.status(404).json({ message: "Member not found" });
    return res.status(200).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a member (hard delete)
 * DELETE /members/:id
 */
export const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const removed = await Member.findByIdAndDelete(id).lean().exec();
    if (!removed) return res.status(404).json({ message: "Member not found" });

    return res.status(200).json({ message: "Member deleted", id: removed._id });
  } catch (err) {
    return next(err);
  }
};

export const getMemberByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: "MemberId is required" });

    const member = await Member.findOne({ code }).populate("role", "role color").lean().exec();

    if (!member) {
      return res.status(404).json({
        message: "Before requesting a book you must be member of the Club",
      });
    }

    return res.status(200).json({ data: member });
  } catch (err) {
    return next(err);
  }
};

export const getMembersList = async (req, res, next) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const currentUser = await User.findById(req.user._id).populate('role', 'role plural').lean().exec();
    const roleName = (currentUser?.role?.role || currentUser?.role?.plural || '').toLowerCase();
    const isSuperAdmin = /super\s*admin/i.test(roleName);

    if (isSuperAdmin) {
      const members = await Member.find()
        .select("_id first_name middle_name last_name full_name code email join_date Profile_picture status region createdAt")
        .sort("-createdAt")
        .lean()
        .exec();
      return res.status(200).json({ data: members });
    }

    if (currentUser?.member) {
      const m = await Member.findById(currentUser.member)
        .select("_id first_name middle_name last_name full_name code email createdAt")
        .lean()
        .exec();
      if (!m) return res.status(200).json({ data: [] });
      return res.status(200).json({ data: [m] });
    }

    return res.status(200).json({ data: [] });
  } catch (err) {
    return next(err);
  }
};

export const bulkCreateMembers = async (req, res, next) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "members must be a non-empty array" });
    }

    const prepared = [];
    const errors = [];

    for (let i = 0; i < members.length; i++) {
      const raw = members[i] || {};

      const first_name = normalize(raw.first_name) || "";
      const last_name = normalize(raw.last_name) || "";
      const middle_name = normalize(raw.middle_name) || "";

      if (!String(first_name).trim() || !String(last_name).trim()) {
        errors.push({ index: i, message: "first_name and last_name are required" });
        continue;
      }

      const email = normalizeEmail(raw.email);
      if (email && !emailRegex.test(email)) {
        errors.push({ index: i, message: `Invalid email: ${email}` });
        continue;
      }

      const doc = {
        first_name: String(first_name).trim(),
        middle_name: String(middle_name).trim(),
        last_name: String(last_name).trim(),
        email: email || "",
        phone: normalize(raw.phone) ? String(raw.phone).trim() : "",
        department: normalize(raw.department) ? String(raw.department).trim() : "",
        student_id: normalize(raw.student_id) ? String(raw.student_id).trim() : "",
        study_year: normalize(raw.study_year) ? String(raw.study_year).trim() : "",
        gender: raw.gender || undefined,
        region: normalize(raw.region) ? String(raw.region).trim() : "",
        city: normalize(raw.city) ? String(raw.city).trim() : "",
        status: raw.status || undefined,
        join_date: toDateOrNull(raw.join_date) || undefined,
        role: raw.role || undefined,
      };

      if (raw.code && String(raw.code).trim()) doc.code = String(raw.code).trim();
      prepared.push(doc);
    }

    const seenEmail = new Set();
    const seenCode = new Set();
    const deduped = [];

    for (const doc of prepared) {
      const e = doc.email ? doc.email.toLowerCase() : "";
      const c = doc.code ? doc.code : "";

      if (e && seenEmail.has(e)) continue;
      if (c && seenCode.has(c)) continue;

      if (e) seenEmail.add(e);
      if (c) seenCode.add(c);
      deduped.push(doc);
    }

    const emails = deduped.map((d) => d.email).filter(Boolean);
    const codes = deduped.map((d) => d.code).filter(Boolean);

    const existing = await Member.find({
      $or: [
        ...(emails.length ? [{ email: { $in: emails } }] : []),
        ...(codes.length ? [{ code: { $in: codes } }] : []),
      ],
    })
      .select("email code")
      .lean()
      .exec();

    const existingEmails = new Set(existing.map((x) => x.email).filter(Boolean));
    const existingCodes = new Set(existing.map((x) => x.code).filter(Boolean));

    const toInsert = [];
    let skippedCount = 0;

    for (const doc of deduped) {
      const e = doc.email ? doc.email.toLowerCase() : "";
      const c = doc.code ? doc.code : "";

      if ((e && existingEmails.has(e)) || (c && existingCodes.has(c))) {
        skippedCount++;
        continue;
      }
      toInsert.push(doc);
    }

    if (toInsert.length === 0) {
      return res.status(200).json({
        message: "No new members inserted (all duplicates or invalid).",
        insertedCount: 0,
        skippedCount,
        errorCount: errors.length,
        errors,
      });
    }

    const inserted = await Member.insertMany(toInsert, { ordered: false });

    return res.status(201).json({
      message: `Bulk members import complete.`,
      insertedCount: inserted.length,
      skippedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "Some records already exist (duplicate email/code).",
        details: err?.keyValue,
      });
    }
    return next(err);
  }
};

export const JoinClub = async (req, res, next) => {
  try {
    const {
      FullName,
      phone,
      email,
      education_level,
      institution,
      readyToTeach,
      teachAreas,
      availability,
      motivation,
    } = req.body;

    if (!FullName || !phone || !email) {
      return res.status(400).json({
        message: "Full name, phone, and email are required",
      });
    }

    const existingRequest = await Clubreq.findOne({ email });
    if (existingRequest) {
      return res.status(409).json({
        message: "A join request with this email already exists",
      });
    }

    const clubRequest = await Clubreq.create({
      FullName,
      phone,
      email,
      education_level,
      institution,
      readyToTeach,
      teachAreas: Array.isArray(teachAreas) ? teachAreas : [],
      availability,
      motivation,
      status: "Pending",
    });

    return res.status(201).json({
      message: "Join club request submitted successfully",
      data: clubRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getJoinClubs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      filter.status = status;
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const [requests, total] = await Promise.all([
      Clubreq.find(filter)
        .populate("memberId", "first_name last_name code email")
        .populate("reviewedBy", "first_name last_name username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Clubreq.countDocuments(filter),
    ]);

    return res.status(200).json({
      count: total,
      data: requests,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    next(error);
  }
};

export const getJoinClubById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await Clubreq.findById(id)
      .populate("memberId", "first_name last_name code email")
      .populate("reviewedBy", "first_name last_name username")
      .lean();

    if (!request) {
      return res.status(404).json({
        message: "Join club request not found",
      });
    }

    return res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};

export const updateJoinClubStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either Approved or Rejected",
      });
    }

    const clubReq = await Clubreq.findById(id);
    if (!clubReq) {
      return res.status(404).json({ message: "Join club request not found" });
    }

    if (clubReq.status !== "Pending") {
      return res.status(409).json({ message: `Request is already ${clubReq.status}` });
    }

    const update = {
      status,
      reviewedBy: req.user?._id || null,
      reviewedAt: new Date(),
    };
    if (status === "Rejected" && rejectionReason) {
      update.rejectionReason = String(rejectionReason).trim();
    }

    let createdMember = null;
    let linkedUser = null;

    if (status === "Approved") {
      const teacherRole = await findTeacherRole();
      const fallbackMemberRole = await findDefaultMemberRole();
      const assignedRoleId = teacherRole?._id || fallbackMemberRole?._id || null;

      let member = await Member.findOne({ email: clubReq.email });

      if (!member) {
        const nameParts = clubReq.FullName.trim().split(/\s+/);
        const first_name = nameParts[0] || clubReq.FullName;
        const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-";

        const newMember = new Member({
          first_name,
          last_name,
          email: clubReq.email,
          phone: clubReq.phone,
          status: "Active",
          isArchived: false,
          role: assignedRoleId,
        });
        member = await newMember.save();
        createdMember = member;
      } else {
        let memberChanged = false;

        if (member.status !== "Active") {
          member.status = "Active";
          memberChanged = true;
        }

        if (member.isArchived) {
          member.isArchived = false;
          memberChanged = true;
        }

        if (assignedRoleId && String(member.role || "") !== String(assignedRoleId)) {
          member.role = assignedRoleId;
          memberChanged = true;
        }

        if (memberChanged) await member.save();
      }

      update.memberId = member._id;

      const inviteToken = crypto.randomBytes(32).toString("hex");
      const inviteTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);

      let user = await User.findOne({ email: clubReq.email }).lean();
      if (!user) {
        const tempPassword = crypto.randomBytes(32).toString("hex");
        const rawBase = clubReq.email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
        const baseUsername = rawBase.length > 0 ? rawBase : `user${Date.now().toString().slice(-6)}`;
        let username = baseUsername;
        const existing = await User.findOne({ username }).lean();
        if (existing) username = `${username}-${Date.now().toString().slice(-4)}`;

        const nameParts = clubReq.FullName.trim().split(/\s+/);
        try {
          user = await User.create({
            first_name: nameParts[0] || clubReq.FullName,
            last_name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-",
            username,
            email: clubReq.email,
            password: tempPassword,
            member_id: member.code || String(member._id),
            role: member.role || assignedRoleId,
            member: member._id,
            status: "pending",
            added_by: req.user?._id || null,
            mustChangePassword: true,
            inviteToken,
            inviteTokenExpires,
            invitedBy: req.user?._id || null,
            invitedAt: new Date(),
          });
          linkedUser = user;
        } catch (userErr) {
          console.error("updateJoinClubStatus: user creation failed", userErr?.message);
        }
      } else {
        linkedUser = user;

        try {
          linkedUser = await User.findByIdAndUpdate(
            user._id,
            {
              $set: {
                mustChangePassword: true,
                inviteToken,
                inviteTokenExpires,
                invitedBy: req.user?._id || null,
                invitedAt: new Date(),
                status: "pending",
                member: member._id,
                member_id: member.code || String(member._id),
                role: member.role || user.role || assignedRoleId,
              },
              $unset: {
                resetPasswordCode: 1,
                resetPasswordExpires: 1,
              },
            },
            { new: true }
          ).lean();
        } catch (updateUserErr) {
          console.error("updateJoinClubStatus: invite token update failed", updateUserErr?.message);
        }
      }

      if (linkedUser) {
        update.userId = linkedUser._id;
        try {
          await Notification.create({
            user: linkedUser._id,
            title: "Welcome to the Club! 🎉",
            message: `Your join request has been approved. Welcome, ${clubReq.FullName}!`,
            type: "success",
            meta: { kind: "join-request-approved", clubreqId: clubReq._id },
          });
        } catch (_) {}
      }

      try {
        if (clubReq.email) {
          const appUrl = process.env.APP_URL || "http://localhost:5173";
          const setupUrl = `${appUrl}/setup-password?token=${inviteToken}`;
          const approvalEmail = joinApprovalTemplate({
            firstName: createdMember?.first_name || linkedUser?.first_name || clubReq.FullName?.split(/\s+/)[0] || "",
            lastName:
              createdMember?.last_name ||
              linkedUser?.last_name ||
              clubReq.FullName?.split(/\s+/).slice(1).join(" ") ||
              "",
            memberCode: createdMember?.code || linkedUser?.member_id || "N/A",
          });
          const welcomeEmail = welcomeEmailTemplate({
            firstName: createdMember?.first_name || linkedUser?.first_name || clubReq.FullName?.split(/\s+/)[0] || "",
            lastName:
              createdMember?.last_name ||
              linkedUser?.last_name ||
              clubReq.FullName?.split(/\s+/).slice(1).join(" ") ||
              "",
            memberCode: createdMember?.code || linkedUser?.member_id || "N/A",
            username: linkedUser?.username,
            setupUrl,
          });

          await sendMail({
            to: clubReq.email,
            subject: welcomeEmail.subject,
            text: `${approvalEmail.text}\n\nUsername: ${linkedUser?.username || "N/A"}\nSet your password: ${setupUrl}`,
            html: welcomeEmail.html,
          });
        }
      } catch (emailErr) {
        console.error("updateJoinClubStatus: approval email failed", emailErr?.message);
      }
    } else {
      const existingUser = await User.findOne({ email: clubReq.email }).lean();
      if (existingUser) {
        try {
          await Notification.create({
            user: existingUser._id,
            title: "Join Request Update",
            message: rejectionReason
              ? `Your join request was not approved. Reason: ${rejectionReason}`
              : "Your join request was not approved at this time.",
            type: "warning",
            meta: { kind: "join-request-rejected", clubreqId: clubReq._id },
          });
        } catch (_) {}
      }

      try {
        if (clubReq.email) {
          const rejectionEmail = joinRejectionTemplate({
            firstName: clubReq.FullName?.split(/\s+/)[0] || "",
            lastName: clubReq.FullName?.split(/\s+/).slice(1).join(" ") || "",
            reason: rejectionReason,
          });

          await sendMail({
            to: clubReq.email,
            subject: rejectionEmail.subject,
            text: rejectionEmail.text,
            html: rejectionEmail.html,
          });
        }
      } catch (emailErr) {
        console.error("updateJoinClubStatus: rejection email failed", emailErr?.message);
      }
    }

    const updatedRequest = await Clubreq.findByIdAndUpdate(id, update, { new: true })
      .populate("memberId", "first_name last_name code email")
      .populate("reviewedBy", "first_name last_name username")
      .lean();

    try {
      await logJoinRequestAction(status.toLowerCase(), updatedRequest, req.user, req, {
        description: `Join request ${status.toLowerCase()} for ${clubReq.email}`,
      });
    } catch (_) {}

    return res.status(200).json({
      message: `Join request ${status.toLowerCase()} successfully`,
      data: updatedRequest,
      createdMember: createdMember || undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberOverview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const member = await Member.findById(id).populate("role", "role plural color").lean();
    if (!member) return res.status(404).json({ message: "Member not found" });

    const user = await User.findOne({ member: member._id })
      .select("_id username email status role createdAt")
      .populate("role", "role plural")
      .lean();

    const issues = await Issue.find({ member: member._id })
      .populate("book", "title author")
      .sort({ issueDate: -1 })
      .lean();

    const overdueCount = issues.filter((i) => i.status === "Overdue").length;
    const issuedCount = issues.filter((i) => i.status === "Issued").length;
    const returnedCount = issues.filter((i) => i.status === "Returned").length;

    const notes = await MemberNote.find({ member: member._id, isArchived: false })
      .populate("author", "first_name last_name username")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      data: {
        member,
        user: user || null,
        issues: {
          list: issues,
          total: issues.length,
          overdueCount,
          issuedCount,
          returnedCount,
        },
        notes,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const createMemberNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }
    const { note, category } = req.body;
    if (!note || !String(note).trim()) {
      return res.status(400).json({ message: "note text is required" });
    }
    const memberExists = await Member.exists({ _id: id });
    if (!memberExists) return res.status(404).json({ message: "Member not found" });

    const created = await MemberNote.create({
      member: id,
      author: req.user._id,
      note: String(note).trim(),
      category: category ? String(category).trim() : "",
    });

    const populated = await MemberNote.findById(created._id)
      .populate("author", "first_name last_name username")
      .lean();

    return res.status(201).json({ data: populated });
  } catch (err) {
    return next(err);
  }
};

export const getMemberNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }
    const notes = await MemberNote.find({ member: id, isArchived: false })
      .populate("author", "first_name last_name username")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ data: notes });
  } catch (err) {
    return next(err);
  }
};

export const deleteMemberNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const note = await MemberNote.findOne({ _id: noteId, member: id });
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.isArchived = true;
    await note.save();
    return res.status(200).json({ message: "Note removed" });
  } catch (err) {
    return next(err);
  }
};

export default {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  archiveMember,
  restoreMember,
  deleteMember,
  getMemberByCode,
  getMembersList,
  bulkCreateMembers,
  JoinClub,
  getJoinClubs,
  getJoinClubById,
  updateJoinClubStatus,
  getMemberOverview,
  createMemberNote,
  getMemberNotes,
  deleteMemberNote,
};
