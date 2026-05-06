/**
 * Phase 8 - System Health Router
 * Admin-only routes for monitoring system health
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import { apiLimiter } from "../utility/rateLimiter.js";
import {
  getSystemHealth,
  getNotificationHealth,
  getJobStatus,
  getDatabaseStats,
  getRecentErrors,
  getSystemSummary,
} from "../controller/SystemHealthController.js";

const SystemHealthRouter = express.Router();

// All system health routes require system health permission
const adminOnly = [protect, requirePermission("View System Health")];

// Get system summary for dashboard
SystemHealthRouter.get("/system-health/summary", adminOnly, apiLimiter, getSystemSummary);

// Get overall system health
SystemHealthRouter.get("/system-health", adminOnly, apiLimiter, getSystemHealth);

// Get notification health stats
SystemHealthRouter.get("/system-health/notifications", adminOnly, apiLimiter, getNotificationHealth);

// Get scheduled job status
SystemHealthRouter.get("/system-health/jobs", adminOnly, apiLimiter, getJobStatus);

// Get database statistics
SystemHealthRouter.get("/system-health/database", adminOnly, apiLimiter, getDatabaseStats);

// Get recent errors
SystemHealthRouter.get("/system-health/errors", adminOnly, apiLimiter, getRecentErrors);

export default SystemHealthRouter;
