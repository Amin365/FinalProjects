import { NAV_ITEMS } from "@/lib/dashboardNav";
import {
  getPermissionSet,
  getRoleName,
  hasAnyPermission,
  isAdminRoleName,
} from "@/lib/permissions";

export function getDesktopModules(user) {
  const roleName = getRoleName(user);
  const permissionSet = getPermissionSet(user?.permissions, user?.role?.permissions);

  const items = isAdminRoleName(roleName)
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => hasAnyPermission(permissionSet, item.permissions));

  return items.map((item) => {
    const title =
      (roleName === "teacher" || roleName === "volunteer") && item.url === "/dashboard/programmecards"
        ? "My Programs"
        : item.title;

    return {
      name: title,
      icon: item.icon,
      link: item.url,
    };
  });
}
