/**
 * Phase 8 - Audit Log Utility
 * Helper functions for creating audit log entries
 */

import AuditLog from "../models/AuditLog.js";

/**
 * Create an audit log entry
 * @param {Object} options
 * @param {Object} options.user - User performing the action (req.user)
 * @param {string} options.action - The action performed
 * @param {string} options.entityType - Type of entity affected
 * @param {string} options.entityId - ID of entity affected
 * @param {string} options.entityLabel - Human-readable label for entity
 * @param {Object} options.changes - Object describing what changed { field: { from, to } }
 * @param {Object} options.meta - Additional metadata
 * @param {Object} options.req - Express request object for IP and user agent
 * @param {string} options.description - Human-readable description
 */
export async function logAudit({
  user = null,
  action,
  entityType,
  entityId = null,
  entityLabel = null,
  changes = {},
  meta = {},
  req = null,
  description = null,
}) {
  try {
    const entry = {
      action,
      entityType,
      entityId,
      entityLabel,
      changes,
      meta,
      description,
    };

    if (user) {
      entry.user = user._id || user;
      entry.userEmail = user.email || null;
      entry.userName = user.first_name
        ? `${user.first_name} ${user.last_name || ""}`.trim()
        : user.username || null;
      
      // Get role name if populated
      if (user.role) {
        entry.userRole = typeof user.role === "object" 
          ? user.role.role || user.role.name 
          : user.role;
      }
    }

    if (req) {
      entry.ipAddress = req.ip || req.connection?.remoteAddress || null;
      entry.userAgent = req.get?.("User-Agent") || null;
    }

    await AuditLog.create(entry);
  } catch (err) {
    // Log error but don't throw - audit logging should not break main operations
    console.error("Failed to create audit log:", err.message);
  }
}

/**
 * Build changes object by comparing old and new values
 * @param {Object} oldDoc - Original document
 * @param {Object} newDoc - Updated document
 * @param {string[]} fields - Fields to compare
 * @returns {Object} Changes object { field: { from, to } }
 */
export function buildChanges(oldDoc, newDoc, fields) {
  const changes = {};
  
  for (const field of fields) {
    const oldVal = oldDoc?.[field];
    const newVal = newDoc?.[field];
    
    // Compare stringified versions for complex types
    const oldStr = JSON.stringify(oldVal ?? null);
    const newStr = JSON.stringify(newVal ?? null);
    
    if (oldStr !== newStr) {
      changes[field] = {
        from: oldVal ?? null,
        to: newVal ?? null,
      };
    }
  }
  
  return changes;
}

/**
 * Log member-related actions
 */
export const logMemberAction = async (action, member, user, req, extra = {}) => {
  await logAudit({
    user,
    action: `member.${action}`,
    entityType: "Member",
    entityId: member._id,
    entityLabel: `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email,
    req,
    ...extra,
  });
};

/**
 * Log book-related actions
 */
export const logBookAction = async (action, book, user, req, extra = {}) => {
  await logAudit({
    user,
    action: `book.${action}`,
    entityType: "Book",
    entityId: book._id,
    entityLabel: book.title || "Unknown Book",
    req,
    ...extra,
  });
};

/**
 * Log issue-related actions
 */
export const logIssueAction = async (action, issue, user, req, extra = {}) => {
  const bookTitle = issue.book?.title || "Unknown Book";
  const memberName = issue.member
    ? `${issue.member.first_name || ""} ${issue.member.last_name || ""}`.trim()
    : "Unknown Member";
  
  await logAudit({
    user,
    action: `issue.${action}`,
    entityType: "Issue",
    entityId: issue._id,
    entityLabel: `${bookTitle} → ${memberName}`,
    req,
    ...extra,
  });
};

/**
 * Log join request actions
 */
export const logJoinRequestAction = async (action, joinRequest, user, req, extra = {}) => {
  await logAudit({
    user,
    action: `join_request.${action}`,
    entityType: "JoinRequest",
    entityId: joinRequest._id,
    entityLabel: joinRequest.FullName || joinRequest.email || "Unknown",
    req,
    ...extra,
  });
};

/**
 * Log role/permission actions
 */
export const logRoleAction = async (action, role, user, req, extra = {}) => {
  await logAudit({
    user,
    action: `role.${action}`,
    entityType: "Role",
    entityId: role._id,
    entityLabel: role.role || role.name || "Unknown Role",
    req,
    ...extra,
  });
};

/**
 * Log user actions
 */
export const logUserAction = async (action, targetUser, actingUser, req, extra = {}) => {
  await logAudit({
    user: actingUser,
    action: `user.${action}`,
    entityType: "User",
    entityId: targetUser._id,
    entityLabel: targetUser.email || targetUser.username || "Unknown User",
    req,
    ...extra,
  });
};

/**
 * Log blog actions
 */
export const logBlogAction = async (action, blog, user, req, extra = {}) => {
  await logAudit({
    user,
    action: `blog.${action}`,
    entityType: "Blog",
    entityId: blog._id,
    entityLabel: blog.title || "Unknown Blog",
    req,
    ...extra,
  });
};

/**
 * Log authentication actions
 */
export const logAuthAction = async (action, user, req, extra = {}) => {
  await logAudit({
    user,
    action: `auth.${action}`,
    entityType: "User",
    entityId: user?._id || null,
    entityLabel: user?.email || "Unknown",
    req,
    ...extra,
  });
};

export default {
  logAudit,
  buildChanges,
  logMemberAction,
  logBookAction,
  logIssueAction,
  logJoinRequestAction,
  logRoleAction,
  logUserAction,
  logBlogAction,
  logAuthAction,
};
