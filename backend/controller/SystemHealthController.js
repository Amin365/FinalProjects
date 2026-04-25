

import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/user.js";
import AuditLog from "../models/AuditLog.js";

// Track scheduled job status in memory
const jobStatus = {
  issueDueScheduler: {
    name: "Issue Due Scheduler",
    lastRun: null,
    status: "unknown",
    errors: [],
  },
  scheduledReporting: {
    name: "Scheduled Reporting",
    lastRun: null,
    status: "unknown",
    errors: [],
  },
  scheduledPublishing: {
    name: "Scheduled Publishing",
    lastRun: null,
    status: "unknown",
    errors: [],
  },
};

/**
 * Update job status (called from scheduler modules)
 * @param {string} jobName - Name of the job
 * @param {string} status - 'success', 'error', 'running'
 * @param {string} error - Error message if status is 'error'
 */
export function updateJobStatus(jobName, status, error = null) {
  if (jobStatus[jobName]) {
    jobStatus[jobName].lastRun = new Date();
    jobStatus[jobName].status = status;
    if (error) {
      jobStatus[jobName].errors.unshift({
        message: error,
        timestamp: new Date(),
      });
      if (jobStatus[jobName].errors.length > 10) {
        jobStatus[jobName].errors = jobStatus[jobName].errors.slice(0, 10);
      }
    } else if (status === "success") {
      jobStatus[jobName].errors = [];
    }
  }
}

/**
 * Get overall system health
 * GET /system-health
 */
export const getSystemHealth = async (req, res, next) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date(),
      checks: {},
    };

    const mongoState = mongoose.connection.readyState;
    health.checks.database = {
      name: "MongoDB",
      status: mongoState === 1 ? "connected" : "disconnected",
      healthy: mongoState === 1,
    };

    const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
    const optionalEnvVars = [
      "RESEND_API_KEY",
      "VAPID_PUBLIC_KEY",
      "VAPID_PRIVATE_KEY",
      "CLOUDINARY_CLOUD_NAME",
    ];

    const missingRequired = requiredEnvVars.filter((v) => !process.env[v]);
    const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);

    health.checks.environment = {
      name: "Environment Variables",
      status: missingRequired.length === 0 ? "configured" : "missing required",
      healthy: missingRequired.length === 0,
      details: {
        missingRequired,
        missingOptional,
      },
    };

    health.checks.email = {
      name: "Email Service",
      status: process.env.RESEND_API_KEY ? "configured" : "not configured",
      healthy: true,
    };

    health.checks.push = {
      name: "Push Notifications",
      status:
        process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
          ? "configured"
          : "not configured",
      healthy: true,
    };

    health.checks.scheduledJobs = {
      name: "Scheduled Jobs",
      status: "running",
      healthy: true,
      jobs: { ...jobStatus },
    };

    const criticalChecks = ["database", "environment"];
    const unhealthy = criticalChecks.filter((c) => !health.checks[c]?.healthy);
    if (unhealthy.length > 0) {
      health.status = "unhealthy";
    }

    return res.status(200).json({ data: health });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get notification failure stats
 * GET /system-health/notifications
 */
export const getNotificationHealth = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const notificationStats = await Notification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { type: "$type", read: "$read" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalNotifications = await Notification.countDocuments({
      createdAt: { $gte: startDate },
    });

    const unreadNotifications = await Notification.countDocuments({
      createdAt: { $gte: startDate },
      read: false,
    });

    const dailyNotifications = await Notification.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      data: {
        totalNotifications,
        unreadNotifications,
        notificationStats,
        dailyNotifications,
        period: parseInt(days, 10),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get scheduled job status
 * GET /system-health/jobs
 */
export const getJobStatus = async (req, res, next) => {
  try {
    return res.status(200).json({
      data: {
        jobs: Object.entries(jobStatus).map(([key, value]) => ({
          id: key,
          ...value,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get database statistics
 * GET /system-health/database
 */
export const getDatabaseStats = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    const stats = await Promise.all(
      collections.map(async (col) => {
        const count = await db.collection(col.name).estimatedDocumentCount();
        return {
          name: col.name,
          documentCount: count,
        };
      })
    );

    stats.sort((a, b) => b.documentCount - a.documentCount);

    const dbStats = await db.stats();

    return res.status(200).json({
      data: {
        collections: stats,
        totalCollections: collections.length,
        totalDocuments: stats.reduce((sum, s) => sum + s.documentCount, 0),
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get recent errors from audit log
 * GET /system-health/errors
 */
export const getRecentErrors = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const failedLogins = await AuditLog.countDocuments({
      action: "auth.failed_login",
      createdAt: { $gte: startDate },
    });

    const errorActions = await AuditLog.find({
      action: { $regex: /error|failed|rejected/i },
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      data: {
        failedLogins,
        recentErrors: errorActions,
        period: parseInt(days, 10),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get system summary for dashboard
 * GET /system-health/summary
 */
export const getSystemSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, todayAuditLogs, pendingNotifications] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      AuditLog.countDocuments({ createdAt: { $gte: today } }),
      Notification.countDocuments({ read: false }),
    ]);

    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    return res.status(200).json({
      data: {
        database: dbStatus,
        totalUsers,
        activeUsers,
        todayAuditLogs,
        pendingNotifications,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getSystemHealth,
  getNotificationHealth,
  getJobStatus,
  getDatabaseStats,
  getRecentErrors,
  getSystemSummary,
  updateJobStatus,
};