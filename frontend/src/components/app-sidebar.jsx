


import * as React from "react"
import {
  AudioWaveform,
  Award,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users2,
  LayoutGrid,
  FileChartColumn,
  User,
  ActivityIcon,
  StickyNote,
  Target,
  Trophy,
  UserPlus2,
  ListOrdered,
  BookMarked,
  ClipboardList,
  Bell,
  Settings,
  Megaphone,
  BarChart3,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { useSelector } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import api from "@/app/api/apislice"


// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title:"Dashbaord",
      url:"/dashboard",
      icon:LayoutGrid,
       isActive: true,


    },
    {
      title:"Users",
      url:'/dashboard/users',
      icon:Users2

    },
    {
      title: "Permissions",
      url: "/dashboard/permissions",
      icon: Settings,
    },
    {
      title: "Books",
      url: "/dashboard/books",
      icon: BookOpen,
     
    
    },
    {
      title: "Members",
      url: "/dashboard/members",
      icon: Users2,
      
    },
    {
      title: "Issue Books ",
      url: "/dashboard/issues",
      icon: BookOpen,
   
    },
    {
      title: " Request Books  ",
      url: "/dashboard/issues/request",
      icon: ClipboardList,
   
    },
    {
      title: "Reservations",
      url: "/dashboard/reservations",
      icon: BookMarked,
    },



    {
      title: "Programs Management",
      url: "/dashboard/programme",
      icon: FileChartColumn,
   
    },
    {
      title: "Resource Management",
      url: "/dashboard/resources",
      icon: Bot,
      
    
   
    },
    {
      title: "volunteer management",
      url: "/dashboard/volunteer",
      icon: ActivityIcon,
    
    },

   
    {
      title: "Enrollments",
      url: "/dashboard/enrollments",
      icon: User,
   
    },
    {
      title: "Attendance",
      url: "/dashboard/pending-reports",
      icon: ClipboardList,
    },


    // {
    //   title: "My Enrollments",
    //   url: "/dashboard/blogs",
    //   icon: StickyNote,
   
    // },
    {
      title: "Join Requests ",
      url: "/dashboard/join-clubs",
      icon: UserPlus2,
   
    },
    {
      title: "Resources",
      url: "/dashboard/challenges",
      icon: Trophy,
   
    },
    
  
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
    {
      title: "Notification Settings",
      url: "/dashboard/notification-settings",
      icon: Settings,
    },
    {
      title: "Announcements",
      url: "/dashboard/announcements",
      icon: Megaphone,
    },

    {
         title: "Reporting Center",
      url: "/dashboard/reporting",
      icon: BarChart3,
    },
    
    // Phase 8: Admin Governance and Safety
    {
      title: "Audit Log",
      url: "/dashboard/audit-log",
      icon: FileChartColumn,
    },
    {
      title: "System Health",
      url: "/dashboard/system-health",
      icon: ActivityIcon,
    }
    
  
   
  
  ],
}




export function AppSidebar({ ...props }) {
  const { user, token } = useSelector((state) => state.auth);

if(!token){
  return null;
}

  // Fetch fresh profile to ensure populated role (object with role name)
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

  const roleName = React.useMemo(() => {
    const roleSource = profileData?.user?.role || user?.role;
    if (!roleSource) return "";
    if (typeof roleSource === "object") return (roleSource.role || roleSource.name || roleSource.title || "").toLowerCase();
    return String(roleSource).toLowerCase();
  }, [profileData, user]);

  // Route arrays for role-based filtering
  const StudentAllowedRoutes = [
    "/dashboard/issues/request",
    "/dashboard/reservations",
    "/dashboard/report",
     "/dashboard/resources",
     
  
  
    "/dashboard/leaderboard",
    "/dashboard/notifications",
    "/dashboard/notification-settings",
  ];

  const LibraryAllowedRoutes = [
    
    "/dashboard/members",
    "/dashboard/Books",
    "/dashboard/issues",
    "/dashboard/issues/request",
    "/dashboard/reservations",
    "/dashboard/leaderboard",

    "/dashboard/notifications",
    "/dashboard/notification-settings",
  ];

  const Admin=[
     "/dashboard/volunteer",
      "/dashboard/resources",
       "/dashboard/programme",
     

      '/dashboard/users',
      
    "/dashboard/notifications",
    "/dashboard/notification-settings",
  ]

  // Phase 8: Admin-only routes including governance features
  const adminOnlyRoutes = [
    "/dashboard/announcements",
    "/dashboard/audit-log",
    "/dashboard/system-health",
    "/dashboard/permissions",
  ];

  const filteredNav = React.useMemo(() => {
    if (roleName === "members") {
      const allowed = new Set(memberAllowedRoutes);
      return data.navMain.filter((item) => allowed.has(item.url));
    }
    if (roleName === "moderator") {
      const allowed = new Set(moderatorAllowedRoutes);
      return data.navMain.filter((item) => allowed.has(item.url));
    }
    // Admin/SuperAdmin gets all routes
    return data.navMain;
  }, [roleName]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
