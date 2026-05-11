import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import {
  getPermissionSet,
  getRoleName,
  canAccessNavItem,
  isAdminRoleName,
} from "@/lib/permissions";
import { NAV_ITEMS } from "@/lib/dashboardNav";

export function AppSidebar({ compact = false, ...props }) {
  const { user, token } = useSelector((state) => state.auth);

  const { data: profileData } = useQuery({
    queryKey: ["sidebar-profile", token],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const currentUser = profileData?.user || user;
  const roleName = React.useMemo(() => getRoleName(currentUser), [currentUser]);
  const permissionSet = React.useMemo(
    () =>
      getPermissionSet(
        profileData?.user?.permissions,
        profileData?.user?.role?.permissions,
        user?.permissions,
        user?.role?.permissions
      ),
    [profileData, user]
  );

  const filteredNav = React.useMemo(() => {
    if (isAdminRoleName(roleName)) {
      return NAV_ITEMS;
    }
    const items = NAV_ITEMS.filter((item) => canAccessNavItem(item, roleName, permissionSet));
    if (roleName === "teacher" || roleName === "volunteer") {
      return items.map((item) =>
        item.url === "/dashboard/programmecards" ? { ...item, title: "My Programs" } : item
      );
    }
    return items;
  }, [roleName, permissionSet]);

  if (!token) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={filteredNav} iconOnly={compact} />
      </SidebarContent>
      <SidebarFooter className={compact ? "hidden" : undefined}>
        <NavUser
          user={{
            name: user?.username || user?.first_name || "User",
            email: user?.email || "",
            avatar: user?.profile_picture || user?.Profile_picture || "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
