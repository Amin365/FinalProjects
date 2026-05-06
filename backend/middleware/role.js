

export const requireRole = (roles = []) => (req, res, next) => {
  const roleName = String(req.user?.role?.role || req.user?.role || "").trim().toLowerCase();
  const allowedRoles = roles.map((role) => String(role).trim().toLowerCase());
  if (!req.user || !allowedRoles.includes(roleName)) {
    return res.status(403).json({ message: "Access denied" });
  }
  return next();
};

/**
 *  - Permission-based middleware
 * Checks if the user has the required permission(s)
 * @param {string|string[]} permissions - Required permission(s)
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAll - If true, requires all permissions; if false, requires any one
 */
export const requirePermission = (permissions, options = {}) => async (req, res, next) => {
  try {
    const { requireAll = false } = options;
    
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user's permissions from JWT or populated user object
    const userPermissions = req.user.permissions || [];
    const permArray = Array.isArray(permissions) ? permissions : [permissions];

    // Normalize permissions to lowercase for comparison
    const normalizedUserPerms = new Set(userPermissions.map((p) => String(p).trim().toLowerCase()).filter(Boolean));
    const normalizedRequired = permArray.map((p) => String(p).trim().toLowerCase()).filter(Boolean);

    let hasAccess = false;

    if (requireAll) {
      // User must have all required permissions
      hasAccess = normalizedRequired.every((p) => normalizedUserPerms.has(p));
    } else {
      // User must have at least one required permission
      hasAccess = normalizedRequired.some((p) => normalizedUserPerms.has(p));
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        required: permArray,
      });
    }

    return next();
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(500).json({ message: "Permission check failed" });
  }
};

/**
 * Combined role OR permission check
 * Allows access if user has the role OR the permission
 */
export const requireRoleOrPermission = (roles = [], permissions = []) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roleName = String(req.user?.role?.role || req.user?.role || "").trim().toLowerCase();
    const hasRole = roles.map((role) => String(role).trim().toLowerCase()).includes(roleName);

    if (hasRole) {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const normalizedUserPerms = new Set(userPermissions.map((p) => String(p).trim().toLowerCase()).filter(Boolean));
    const hasPermission = permissions.some((p) => normalizedUserPerms.has(String(p).trim().toLowerCase()));

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("Role/permission check error:", error);
    return res.status(500).json({ message: "Access check failed" });
  }
};
