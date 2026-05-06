import * as React from "react";
import {
  ActivityIcon,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  ClipboardList,
  FileChartColumn,
  LayoutGrid,
  Megaphone,
  Settings,
  Trophy,
  User,
  UserPlus2,
  Users2,
} from "lucide-react";
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
  hasAnyPermission,
  isAdminRoleName,
} from "@/lib/permissions";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, isActive: true },
  { title: "Users", url: "/dashboard/users", icon: Users2, permissions: ["View Users"] },
  { title: "Permissions", url: "/dashboard/permissions", icon: Settings, permissions: ["Manage Permissions", "View Role"] },
  { title: "Books", url: "/dashboard/books", icon: BookOpen, permissions: ["Manage Books"] },
  { title: "Members", url: "/dashboard/members", icon: Users2, permissions: ["Manage Members"] },
  { title: "Issue Books", url: "/dashboard/issues", icon: BookOpen, permissions: ["Manage Issues", "Manage Books"] },
  { title: "Request Books", url: "/dashboard/issues/request", icon: ClipboardList, permissions: ["Manage Issues"] },
  { title: "Reservations", url: "/dashboard/reservations", icon: BookMarked, permissions: ["Manage Reservations"] },
  { title: "Programs Management", url: "/dashboard/programme", icon: FileChartColumn, permissions: ["Manage Programme"] },
  { title: "Resource Management", url: "/dashboard/resources", icon: Bot, permissions: ["Manage Resource"] },
  { title: "Teacher Management", url: "/dashboard/join-clubs", icon: ActivityIcon, permissions: ["Manage Teacher"] },
  { title: "Enrollments", url: "/dashboard/enrollments", icon: User, permissions: ["View Enrollments"] },
  { title: "Attendance", url: "/dashboard/attendance", icon: ClipboardList, permissions: ["View Attendance"] },
  { title: "Programs", url: "/dashboard/programmecards", icon: FileChartColumn, permissions: ["View Programme"] },
  { title: "Resources", url: "/dashboard/studentsresources", icon: Trophy, permissions: ["View Resource"] },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell, permissions: ["View Notifications"] },
  { title: "Notification Settings", url: "/dashboard/notification-settings", icon: Settings, permissions: ["Manage Notification Settings"] },
  { title: "Announcements", url: "/dashboard/announcements", icon: Megaphone, permissions: ["Manage Announcements"] },
  { title: "Reporting Center", url: "/dashboard/reporting", icon: BarChart3, permissions: ["View Reports"] },
  { title: "Audit Log", url: "/dashboard/audit-log", icon: FileChartColumn, permissions: ["View Audit Log"] },
  { title: "System Health", url: "/dashboard/system-health", icon: ActivityIcon, permissions: ["View System Health"] },
];

export function AppSidebar(props) {
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
    const items = NAV_ITEMS.filter((item) => hasAnyPermission(permissionSet, item.permissions));
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
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
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
