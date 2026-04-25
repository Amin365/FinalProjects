/**
 * Phase 8 - Audit Log Controller
 * API endpoints for querying audit logs (admin only)
 */

import AuditLog from "../models/AuditLog.js";

/**
 * Get audit logs with filtering and pagination
 * GET /audit-logs
 * Query params: page, limit, action, entityType, entityId, userId, startDate, endDate
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    const filter = {};

    // Filter by action
    if (action) {
      filter.action = action;
    }

    // Filter by entity type
    if (entityType) {
      filter.entityType = entityType;
    }

    // Filter by entity ID
    if (entityId) {
      filter.entityId = entityId;
    }

    // Filter by user who performed the action
    if (userId) {
      filter.user = userId;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search in description or entity label
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { description: regex },
        { entityLabel: regex },
        { userEmail: regex },
        { userName: regex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate("user", "first_name last_name email username")
        .lean()
        .exec(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: logs,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get a single audit log entry by ID
 * GET /audit-logs/:id
 */
export const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id)
      .populate("user", "first_name last_name email username")
      .lean()
      .exec();

    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    return res.status(200).json({ data: log });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get audit log statistics
 * GET /audit-logs/stats
 */
export const getAuditLogStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    // Get counts by action type
    const actionCounts = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get counts by entity type
    const entityCounts = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$entityType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get most active users
    const activeUsers = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate }, user: { $ne: null } } },
      { $group: { _id: "$user", count: { $sum: 1 }, userName: { $first: "$userName" }, userEmail: { $first: "$userEmail" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get daily counts for chart
    const dailyCounts = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalCount = await AuditLog.countDocuments({ createdAt: { $gte: startDate } });

    return res.status(200).json({
      data: {
        totalCount,
        actionCounts,
        entityCounts,
        activeUsers,
        dailyCounts,
        period: parseInt(days, 10),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get audit logs for a specific entity
 * GET /audit-logs/entity/:entityType/:entityId
 */
export const getEntityAuditLogs = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = { entityType, entityId };
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate("user", "first_name last_name email username")
        .lean()
        .exec(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: logs,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get available action types
 * GET /audit-logs/actions
 */
export const getActionTypes = async (req, res, next) => {
  try {
    const actions = await AuditLog.distinct("action");
    return res.status(200).json({ data: actions });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get available entity types
 * GET /audit-logs/entity-types
 */
export const getEntityTypes = async (req, res, next) => {
  try {
    const entityTypes = await AuditLog.distinct("entityType");
    return res.status(200).json({ data: entityTypes });
  } catch (err) {
    return next(err);
  }
};

export default {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  getEntityAuditLogs,
  getActionTypes,
  getEntityTypes,
};
