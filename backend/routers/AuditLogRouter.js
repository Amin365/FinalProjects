/**
 * Phase 8 - Audit Log Router
 * Admin-only routes for viewing audit logs
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import { requirePermission } from "../middleware/role.js";
import { apiLimiter } from "../utility/rateLimiter.js";
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  getEntityAuditLogs,
  getActionTypes,
  getEntityTypes,
} from "../controller/AuditLogController.js";

const AuditLogRouter = express.Router();

// All audit log routes require audit log permission
const adminOnly = [protect, requirePermission("View Audit Log")];

// Get audit log statistics
AuditLogRouter.get("/audit-logs/stats", adminOnly, apiLimiter, getAuditLogStats);

// Get available action types
AuditLogRouter.get("/audit-logs/actions", adminOnly, apiLimiter, getActionTypes);

// Get available entity types
AuditLogRouter.get("/audit-logs/entity-types", adminOnly, apiLimiter, getEntityTypes);

// Get audit logs for a specific entity
AuditLogRouter.get("/audit-logs/entity/:entityType/:entityId", adminOnly, apiLimiter, getEntityAuditLogs);

// Get audit logs with filtering
AuditLogRouter.get("/audit-logs", adminOnly, apiLimiter, getAuditLogs);

// Get a single audit log entry
AuditLogRouter.get("/audit-logs/:id", adminOnly, apiLimiter, getAuditLogById);

export default AuditLogRouter;
