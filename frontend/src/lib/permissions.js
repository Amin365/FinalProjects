export const normalizeAccessValue = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const getRoleName = (user) => {
  const roleSource = user?.role;
  if (!roleSource) return "";

  if (typeof roleSource === "object") {
    return normalizeAccessValue(
      roleSource.role || roleSource.name || roleSource.title || roleSource.plural
    );
  }

  return normalizeAccessValue(roleSource);
};

export const isAdminRoleName = (roleName = "") => {
  const normalized = normalizeAccessValue(roleName);
  return normalized === "admin" || normalized === "super admin";
};

export const getPermissionName = (permission) => {
  if (!permission) return "";

  if (typeof permission === "object") {
    return normalizeAccessValue(
      permission.permission ||
        permission.name ||
        permission.title ||
        permission.permissionDetails?.permission ||
        permission.permissionDetails?.name ||
        permission.permission?.permission ||
        permission.permission?.name
    );
  }

  return normalizeAccessValue(permission);
};

export const getPermissionSet = (...permissionLists) => {
  const permissions = permissionLists.flatMap((list) => (Array.isArray(list) ? list : []));
  return new Set(permissions.map(getPermissionName).filter(Boolean));
};

export const hasAnyPermission = (permissionSet, permissions = []) => {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  const normalizedRequired = required.map(getPermissionName).filter(Boolean);

  if (!normalizedRequired.length) return true;
  return normalizedRequired.some((permission) => permissionSet.has(permission));
};

export const hasAllowedRole = (roleName = "", roles = []) => {
  const normalizedRole = normalizeAccessValue(roleName);
  const normalizedRoles = (Array.isArray(roles) ? roles : [roles])
    .map(normalizeAccessValue)
    .filter(Boolean);

  return normalizedRoles.includes(normalizedRole);
};

export const canAccessNavItem = (item, roleName, permissionSet) => {
  if (hasAllowedRole(roleName, item.hiddenForRoles)) return false;
  if (hasAllowedRole(roleName, item.allowedRoles)) return true;
  return hasAnyPermission(permissionSet, item.permissions);
};

export const hasAllPermissions = (permissionSet, permissions = []) => {
  const required = Array.isArray(permissions) ? permissions : [permissions];
  const normalizedRequired = required.map(getPermissionName).filter(Boolean);

  if (!normalizedRequired.length) return true;
  return normalizedRequired.every((permission) => permissionSet.has(permission));
};
