import mongoose from "mongoose";

/**
 * Phase 8 - Audit Log Model
 * Tracks actions like: member created/updated/deleted, book created/updated/deleted,
 * issue issued/returned, join request approved/rejected, role changed, report status changed,
 * blog published/deleted, permission changes
 */
const AuditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Denormalized user info for historical reference
    userEmail: { type: String, trim: true },
    userName: { type: String, trim: true },
    userRole: { type: String, trim: true },

    // What action was performed
    action: {
      type: String,
      required: true,
      enum: [
        // Member actions
        "member.created",
        "member.updated",
        "member.deleted",
        "member.archived",
        "member.restored",
        // Book actions
        "book.created",
        "book.updated",
        "book.deleted",
        // Issue actions
        "issue.created",
        "issue.returned",
        "issue.updated",
        // Join request actions
        "join_request.created",
        "join_request.approved",
        "join_request.rejected",
        // Role and permission actions
        "role.created",
        "role.updated",
        "role.deleted",
        "role.permission_added",
        "role.permission_removed",
        "user.role_changed",
        "user.permission_added",
        "user.permission_removed",
        // Report actions
        "report.created",
        "report.updated",
        "report.status_changed",
        // Blog actions
        "blog.created",
        "blog.updated",
        "blog.published",
        "blog.unpublished",
        "blog.deleted",
        // Resource actions
        "resource.created",
        "resource.updated",
        "resource.deleted",
        // User actions
        "user.created",
        "user.updated",
        "user.deleted",
        "user.password_reset_requested",
        "user.password_changed",
        "user.invited",
        // Auth actions
        "auth.login",
        "auth.logout",
        "auth.failed_login",
        // Challenge actions
        "challenge.created",
        "challenge.updated",
        "challenge.deleted",
        // Reservation actions
        "reservation.created",
        "reservation.cancelled",
        "reservation.fulfilled",
        // Other
        "other",
      ],
      index: true,
    },

    // What entity was affected
    entityType: {
      type: String,
      enum: [
        "Member",
        "Book",
        "Issue",
        "JoinRequest",
        "Role",
        "Permission",
        "User",
        "Report",
        "Blog",
        "Resource",
        "Challenge",
        "Reservation",
        "Other",
      ],
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Entity label for historical reference (e.g., member name, book title)
    entityLabel: { type: String, trim: true },

    // What changed - previous and new values
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Additional context/metadata
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // IP address and user agent
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },

    // Description of the action (human-readable)
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
