import Notification from "../models/Notification.js";
import User from "../models/user.js";
import Member from "../models/Members.js";
import Issue from "../models/Issue.js";
import Program from "../models/Program.js";
import Enrollment from "../models/Enrollment.js";
import Role from "../models/Role.js";
import { sendMail, buildEmailHtml } from "./EmailController.js";
import { sendPushToUser } from "../utility/push.js";
import { checkUserPreference, isInQuietHours } from "./NotificationPreferencesController.js";

const APP_NAME = process.env.APP_NAME || "JJU Reading Club";

const getRoleNameFromReqUser = (u) =>
  String(u?.role?.role || u?.role?.plural || u?.role || "")
    .toLowerCase()
    .trim();

const isAdminRole = (roleName) => /super\s*admin/i.test(roleName) || /^admin$/i.test(roleName);
const isLibraryStaffRole = (roleName) => /^library\s*staff$/i.test(roleName);
const isTeacherRole = (roleName) => /^teacher$/i.test(roleName);

const ANNOUNCEMENT_AUDIENCES = [
  // legacy
  "all",
  "members",
  "inactive",
  "overdue",
  // new
  "students",
  "program_teachers",
  "my_students",
];

async function findRoleByRegex(regex) {
  return Role.findOne({ role: { $regex: regex } }).lean();
}

async function getTeacherProgramIds(teacherUserId) {
  const teacherId = String(teacherUserId);
  const programs = await Program.find({
    $or: [{ teacherId }, { assistants: teacherId }],
  })
    .select("_id")
    .lean();
  return programs.map((p) => String(p._id));
}


async function getTargetAudience(targetAudience, { senderUserId } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (targetAudience) {
    case "all":
      return User.find({ status: "Active" })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();

    case "members": {
      // Users with "Members" role
      const memberRole = await Role.findOne({ role: { $regex: /^members?$/i } }).lean();
      if (!memberRole) return [];
      return User.find({ role: memberRole._id, status: "Active" })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();
    }

    case "students": {
      const studentRole = await findRoleByRegex(/^student$/i);
      if (!studentRole) return [];
      return User.find({ role: studentRole._id, status: "Active" })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();
    }

    case "program_teachers": {
      const teacherRole = await findRoleByRegex(/^teachers?$/i);

      const roleIds = [teacherRole?._id].filter(Boolean);
      if (!roleIds.length) return [];

      return User.find({ role: { $in: roleIds }, status: "Active" })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();
    }

    case "my_students": {
      if (!senderUserId) return [];

      const programIds = await getTeacherProgramIds(senderUserId);
      if (!programIds.length) return [];

      const enrollments = await Enrollment.find({
        programId: { $in: programIds },
        status: { $in: ["confirmed", "pending", "waitlisted"] },
      })
        .select("userId")
        .lean();

      const enrolledUserIds = Array.from(new Set(enrollments.map((e) => String(e.userId)).filter(Boolean)));
      if (!enrolledUserIds.length) return [];

      const studentRole = await findRoleByRegex(/^student$/i);
      if (!studentRole) return [];

      return User.find({ _id: { $in: enrolledUserIds }, role: studentRole._id, status: "Active" })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();
    }

    case "inactive": {
      // Inactive = users whose linked member has Inactive status
      const inactiveMembers = await Member.find({
        status: { $in: ["Inactive", "inactive"] },
      })
        .select("_id")
        .lean();

      const inactiveMemberIds = inactiveMembers.map((m) => m._id);

      if (!inactiveMemberIds.length) return [];

      return User.find({
        member: { $in: inactiveMemberIds },
        status: "Active",
      })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();
    }

    case "overdue": {
      // Users with overdue book issues - use distinct() for efficient deduplication
      const overdueMemberIds = await Issue.distinct("member", {
        returnDate: { $lt: today },
        returnedAt: null,
      }).exec();

      if (!overdueMemberIds.length) return [];

      return User.find({
        member: { $in: overdueMemberIds },
        status: "Active",
      })
        .select("_id email member")
        .populate("member", "first_name last_name email")
        .lean()
        .exec();
    }

    default:
      return [];
  }
}

// Create a bulk announcement
export const createAnnouncement = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleName = getRoleNameFromReqUser(req.user);
    const canSend = isAdminRole(roleName) || isLibraryStaffRole(roleName) || isTeacherRole(roleName);
    if (!canSend) return res.status(403).json({ message: "You are not allowed to send announcements" });

    const {
      title,
      message,
      targetAudience = "all",
      sendEmail = false,
      sendPush = true,
      ctaLabel,
      ctaUrl,
      expiresAt,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    if (!ANNOUNCEMENT_AUDIENCES.includes(targetAudience)) {
      return res.status(400).json({
        message: `Invalid target audience. Must be one of: ${ANNOUNCEMENT_AUDIENCES.join(", ")}`,
      });
    }

    // Audience permission rules
    const allowedAudiences = (() => {
      if (isAdminRole(roleName)) return ANNOUNCEMENT_AUDIENCES;
      if (isLibraryStaffRole(roleName)) return ["students", "program_teachers"];
      if (isTeacherRole(roleName)) return ["my_students"];
      return [];
    })();

    if (!allowedAudiences.includes(targetAudience)) {
      return res.status(403).json({ message: "You are not allowed to send to that audience" });
    }

    // Get target users
    const targetUsers = await getTargetAudience(targetAudience, { senderUserId: userId });

    if (targetUsers.length === 0) {
      return res.status(400).json({ message: "No users found for the selected audience" });
    }

    // Create notifications for all target users
    const notifications = targetUsers.map((user) => ({
      user: user._id,
      title,
      message,
      type: "announcement",
      category: "announcement",
      read: false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      meta: {
        kind: "bulk-announcement",
        createdBy: userId,
        targetAudience,
        ctaLabel,
        ctaUrl,
      },
    }));

    await Notification.insertMany(notifications);

    // Send push notifications (respecting user preferences and quiet hours)
    if (sendPush) {
      for (const user of targetUsers) {
        try {
          const canSendPush = await checkUserPreference(user._id, "pushOnSystemAnnouncement");
          const inQuietHours = await isInQuietHours(user._id);

          if (canSendPush && !inQuietHours) {
            await sendPushToUser(user._id, {
              title: `📢 ${title}`,
              body: message.substring(0, 200),
              data: { url: ctaUrl || "/dashboard/notifications" },
            });
          }
        } catch (pushErr) {
          console.error(`Push notification failed for user ${user._id}:`, pushErr.message);
        }
      }
    }

    // Send emails (if enabled)
    if (sendEmail) {
      for (const user of targetUsers) {
        try {
          const canSendEmail = await checkUserPreference(user._id, "emailOnAnnouncement");
          if (!canSendEmail) continue;

          const recipientEmail = user.email || user.member?.email;
          if (!recipientEmail) continue;

          const firstName = user.member?.first_name || "";
          const lastName = user.member?.last_name || "";
          const fullName = `${firstName} ${lastName}`.trim() || "Reader";

          await sendMail({
            to: recipientEmail,
            subject: `📢 ${title}`,
            text: `Dear ${fullName},\n\n${message}\n\nBest regards,\nThe ${APP_NAME} Team`,
            html: buildEmailHtml({
              title: `📢 ${title}`,
              preheader: message.substring(0, 100),
              greeting: `Dear ${fullName}`,
              bodyLines: [message],
              ctaLabel: ctaLabel || null,
              ctaUrl: ctaUrl || null,
              footerNote: `This announcement was sent from ${APP_NAME}.`,
            }),
          });
        } catch (emailErr) {
          console.error(`Email failed for user ${user._id}:`, emailErr.message);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Announcement sent to ${targetUsers.length} users`,
      data: {
        recipientCount: targetUsers.length,
        targetAudience,
        sendEmail,
        sendPush,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// Get announcement history (admin only)
export const getAnnouncementHistory = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleName = getRoleNameFromReqUser(req.user);
    const canView = isAdminRole(roleName) || isLibraryStaffRole(roleName) || isTeacherRole(roleName);
    if (!canView) return res.status(403).json({ message: "You are not allowed to view announcement history" });

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;

    const baseMatch = isAdminRole(roleName)
      ? { "meta.kind": "bulk-announcement" }
      : { "meta.kind": "bulk-announcement", "meta.createdBy": userId };

    const announcements = await Notification.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            title: "$title",
            message: "$message",
            createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } },
          },
          title: { $first: "$title" },
          message: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
          targetAudience: { $first: "$meta.targetAudience" },
          createdBy: { $first: "$meta.createdBy" },
          recipientCount: { $sum: 1 },
          readCount: { $sum: { $cond: ["$read", 1, 0] } },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage },
    ]).exec();

    const total = await Notification.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            title: "$title",
            message: "$message",
            createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } },
          },
        },
      },
      { $count: "total" },
    ]).exec();

    return res.json({
      data: announcements,
      total: total[0]?.total || 0,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil((total[0]?.total || 0) / perPage),
    });
  } catch (err) {
    return next(err);
  }
};

// Get audience preview (count of users that would receive the announcement)
export const getAudiencePreview = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleName = getRoleNameFromReqUser(req.user);
    const canPreview = isAdminRole(roleName) || isLibraryStaffRole(roleName) || isTeacherRole(roleName);
    if (!canPreview) return res.status(403).json({ message: "You are not allowed to preview audiences" });

    const { targetAudience = "all" } = req.query;

    if (!ANNOUNCEMENT_AUDIENCES.includes(targetAudience)) {
      return res.status(400).json({ message: "Invalid target audience" });
    }

    const allowedAudiences = (() => {
      if (isAdminRole(roleName)) return ANNOUNCEMENT_AUDIENCES;
      if (isLibraryStaffRole(roleName)) return ["students", "program_teachers"];
      if (isTeacherRole(roleName)) return ["my_students"];
      return [];
    })();

    if (!allowedAudiences.includes(targetAudience)) {
      return res.status(403).json({ message: "You are not allowed to preview that audience" });
    }

    const targetUsers = await getTargetAudience(targetAudience, { senderUserId: userId });

    return res.json({
      data: {
        targetAudience,
        count: targetUsers.length,
        preview: targetUsers.slice(0, 5).map((u) => ({
          id: u._id,
          email: u.email || u.member?.email,
          name: u.member ? `${u.member.first_name || ""} ${u.member.last_name || ""}`.trim() : "Unknown",
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createAnnouncement,
  getAnnouncementHistory,
  getAudiencePreview,
};