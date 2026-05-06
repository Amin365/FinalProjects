/**
 * Phase 8 - Permission Hook
 * Check user permissions in frontend components
 */

import { useSelector } from "react-redux";
import { useMemo } from "react";
import {
  getPermissionName,
  getPermissionSet,
  getRoleName,
  hasAllPermissions,
  hasAnyPermission,
  isAdminRoleName,
} from "@/lib/permissions";

/**
 * Hook to check if user has specific permission(s)
 * @param {string|string[]} permissions - Permission(s) to check
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAll - If true, requires all permissions
 * @returns {Object} Permission check results
 */
export function usePermission(permissions, options = {}) {
  const { user } = useSelector((state) => state.auth);
  const { requireAll = false } = options;

  return useMemo(() => {
    if (!user) {
      return {
        hasPermission: false,
        isLoading: false,
        permissions: [],
      };
    }

    const userPermissions = user.permissions || [];
    const permissionSet = getPermissionSet(userPermissions, user.role?.permissions);
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    const normalizedRequired = permArray.map(getPermissionName).filter(Boolean);
    const hasPermission = requireAll
      ? hasAllPermissions(permissionSet, normalizedRequired)
      : hasAnyPermission(permissionSet, normalizedRequired);

    return {
      hasPermission,
      isLoading: false,
      permissions: userPermissions,
      missingPermissions: normalizedRequired.filter((p) => !permissionSet.has(p)),
    };
  }, [user, permissions, requireAll]);
}

/**
 * Hook to check if user has specific role(s)
 * @param {string|string[]} roles - Role(s) to check
 * @returns {Object} Role check results
 */
export function useRole(roles) {
  const { user } = useSelector((state) => state.auth);

  return useMemo(() => {
    if (!user || !user.role) {
      return {
        hasRole: false,
        isLoading: false,
        roleName: null,
      };
    }

    const roleName = getRoleName(user);
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const normalizedRoles = roleArray.map(getPermissionName).filter(Boolean);
    const hasRole = normalizedRoles.includes(roleName);

    return {
      hasRole,
      isLoading: false,
      roleName,
    };
  }, [user, roles]);
}

/**
 * Hook to check if user has role OR permission
 * @param {string[]} roles - Roles to check
 * @param {string[]} permissions - Permissions to check
 * @returns {Object} Access check results
 */
export function useAccess(roles = [], permissions = []) {
  const { hasRole, roleName } = useRole(roles);
  const { hasPermission, permissions: userPerms } = usePermission(permissions);

  return useMemo(() => ({
    hasAccess: hasRole || hasPermission,
    hasRole,
    hasPermission,
    roleName,
    permissions: userPerms,
  }), [hasRole, hasPermission, roleName, userPerms]);
}

/**
 * Hook to check if user is admin
 * @returns {Object} Admin check results
 */
export function useIsAdmin() {
  const { roleName } = useRole(["Super Admin", "Admin"]);
  return {
    isAdmin: isAdminRoleName(roleName),
    roleName,
  };
}

/**
 * Hook to check if user is super admin
 * @returns {Object} Super admin check results
 */
export function useIsSuperAdmin() {
  const { hasRole, roleName } = useRole(["Super Admin"]);
  return {
    isSuperAdmin: hasRole,
    roleName,
  };
}

export default usePermission;
