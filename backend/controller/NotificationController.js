import Notification from "../models/Notification.js";
import User from "../models/user.js";
import mongoose from "mongoose";

// Helper to get user role info
async function getUserRoleInfo(userId) {
  const currentUser = await User.findById(userId)
    .populate("role", "role plural")
    .lean()
    .exec();

  const roleName = (currentUser?.role?.role || currentUser?.role?.plural || "").toLowerCase();
  const isSuperAdmin = /super\s*admin/i.test(roleName);

  return { currentUser, roleName, isSuperAdmin };
}

// Helper to build notification filter based on role
async function buildNotificationFilter(userId, roleInfo, extraFilters = {}) {
  const { isSuperAdmin } = roleInfo;
  let notifFilter = { ...extraFilters };

  if (isSuperAdmin) {
    // Super admin: see all notifications except member missed-report reminders
    notifFilter = { ...notifFilter, "meta.kind": { $ne: "missed-daily-report" } };
  } else {
    // Regular user: only notifications for themselves
    notifFilter = { ...notifFilter, user: new mongoose.Types.ObjectId(userId) };
  }

  return notifFilter;
}

// List notifications for the logged in user with proper scoping
export const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { page = 1, limit = 10, type, category, read } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * perPage;

    const roleInfo = await getUserRoleInfo(userId);

    const extraFilters = {};
    if (type) extraFilters.type = type;
    if (category) extraFilters.category = category;
    if (read !== undefined) extraFilters.read = read === "true";

    const notifFilter = await buildNotificationFilter(userId, roleInfo, extraFilters);

    const [items, total] = await Promise.all([
      Notification.find(notifFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean()
        .exec(),
      Notification.countDocuments(notifFilter).exec(),
    ]);

    return res.json({
      data: items,
      total,
      page: pageNum,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    return next(err);
  }
};

// Mark ALL notifications for user (or scope) as read
export const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleInfo = await getUserRoleInfo(userId);
    const updateFilter = await buildNotificationFilter(userId, roleInfo, { read: false });

    await Notification.updateMany(updateFilter, { $set: { read: true } }).exec();
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

// Mark ONE notification as read
export const markOneRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notif = await Notification.findById(id).lean().exec();
    if (!notif) return res.status(404).json({ message: "Notification not found" });

    const roleInfo = await getUserRoleInfo(userId);
    const { isSuperAdmin } = roleInfo;

    const allowed = isSuperAdmin || String(notif.user) === String(userId);
    if (!allowed) return res.status(403).json({ message: "Forbidden" });

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    ).lean().exec();

    return res.json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

// Get notification statistics for the current user
export const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleInfo = await getUserRoleInfo(userId);
    const baseFilter = await buildNotificationFilter(userId, roleInfo, {});

    const [total, unread, byType, byCategory] = await Promise.all([
      Notification.countDocuments(baseFilter).exec(),
      Notification.countDocuments({ ...baseFilter, read: false }).exec(),
      Notification.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]).exec(),
      Notification.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]).exec(),
    ]);

    return res.json({
      data: {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id || "unknown"] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// Delete a single notification
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const notif = await Notification.findById(id).lean().exec();
    if (!notif) return res.status(404).json({ message: "Notification not found" });

    const roleInfo = await getUserRoleInfo(userId);
    const { isSuperAdmin } = roleInfo;

    // Only owner or super admin can delete
    if (!isSuperAdmin && String(notif.user) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Notification.findByIdAndDelete(id).exec();
    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    return next(err);
  }
};

// Delete all read notifications for user
export const deleteAllRead = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const roleInfo = await getUserRoleInfo(userId);
    const { isSuperAdmin } = roleInfo;

    let deleteFilter = { read: true };
    if (!isSuperAdmin) {
      deleteFilter.user = new mongoose.Types.ObjectId(userId);
    }

    const result = await Notification.deleteMany(deleteFilter).exec();
    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
    });
  } catch (err) {
    return next(err);
  }
};