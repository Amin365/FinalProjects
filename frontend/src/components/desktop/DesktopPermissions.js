import { getDesktopModules } from "@/lib/desktopModules";

export function DesktopPermissions(user) {
  return getDesktopModules(user);
}
