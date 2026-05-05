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

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, isActive: true },
  { title: "Users", url: "/dashboard/users", icon: Users2 },
  { title: "Permissions", url: "/dashboard/permissions", icon: Settings },
  { title: "Books", url: "/dashboard/books", icon: BookOpen },
  { title: "Members", url: "/dashboard/members", icon: Users2 },
  { title: "Issue Books", url: "/dashboard/issues", icon: BookOpen },
  { title: "Request Books", url: "/dashboard/issues/request", icon: ClipboardList },
  { title: "Reservations", url: "/dashboard/reservations", icon: BookMarked },
  { title: "Programs Management", url: "/dashboard/programme", icon: FileChartColumn },
  { title: "Resource Management", url: "/dashboard/resources", icon: Bot },
  { title: "Volunteer Management", url: "/dashboard/join-clubs", icon: ActivityIcon },
  { title: "Enrollments", url: "/dashboard/enrollments", icon: User },
  { title: "Attendance", url: "/dashboard/attendance", icon: ClipboardList },
  { title: "Programs", url: "/dashboard/programmecards", icon: FileChartColumn },
  { title: "Resources", url: "/dashboard/studentsresources", icon: Trophy },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Notification Settings", url: "/dashboard/notification-settings", icon: Settings },
  { title: "Announcements", url: "/dashboard/announcements", icon: Megaphone },
  { title: "Reporting Center", url: "/dashboard/reporting", icon: BarChart3 },
  { title: "Audit Log", url: "/dashboard/audit-log", icon: FileChartColumn },
  { title: "System Health", url: "/dashboard/system-health", icon: ActivityIcon },
];

const isAdminRoleName = (roleName = "") =>
  /super\s*admin/i.test(roleName) || /^admin$/i.test(roleName);

const LIBRARY_STAFF_ROUTES = new Set([
  "/dashboard",
  "/dashboard/books",
  "/dashboard/members",
  "/dashboard/issues",
  "/dashboard/issues/request",
  "/dashboard/reservations",
  "/dashboard/announcements",
  "/dashboard/notifications",
  "/dashboard/notification-settings",
  "/dashboard/studentsresources",
]);

const STUDENT_ROUTES = new Set([
  "/dashboard",
  "/dashboard/issues/request",
  "/dashboard/reservations",
 "/dashboard/studentsresources",
"/dashboard/programmecards",
  "/dashboard/notifications",
  "/dashboard/notification-settings",

]);

const VOLUNTEER_ROUTES = new Set([
  "/dashboard",
  "/dashboard/enrollments",
  "/dashboard/programmecards",
  "/dashboard/attendance",
  "/dashboard/resources",
  "/dashboard/announcements",
  "/dashboard/notifications",
  "/dashboard/notification-settings",
])




const DEFAULT_SAFE_ROUTES = new Set([
  "/dashboard",
  "/dashboard/notifications",
  "/dashboard/notification-settings",
]);

const getRoleName = (profileData, user) => {
  const roleSource = profileData?.user?.role || user?.role;
  if (!roleSource) return "";
  if (typeof roleSource === "object") {
    return String(roleSource.role || roleSource.name || roleSource.title || "").toLowerCase();
  }
  return String(roleSource).toLowerCase();
};

const getVisibleRoutesForRole = (roleName) => {
  const normalizedRole = String(roleName || "").toLowerCase();
  if (isAdminRoleName(normalizedRole)) return null;
  if (normalizedRole === "library staff" || normalizedRole === "teacher") return LIBRARY_STAFF_ROUTES;
  if (normalizedRole === "student") return STUDENT_ROUTES;
  if (normalizedRole === "volunteer") return VOLUNTEER_ROUTES;
  return DEFAULT_SAFE_ROUTES;
};

export function AppSidebar(props) {
  const { user, token } = useSelector((state) => state.auth);

  if (!token) {
    return null;
  }

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

  const roleName = React.useMemo(() => getRoleName(profileData, user), [profileData, user]);

  const filteredNav = React.useMemo(() => {
    const visibleRoutes = getVisibleRoutesForRole(roleName);
    if (!visibleRoutes) {
      return NAV_ITEMS;
    }
    const items = NAV_ITEMS.filter((item) => visibleRoutes.has(item.url));
    if (roleName === "volunteer") {
      return items.map((item) =>
        item.url === "/dashboard/programmecards" ? { ...item, title: "My Programs" } : item
      );
    }
    return items;
  }, [roleName]);

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
