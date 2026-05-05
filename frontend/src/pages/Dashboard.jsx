import { Menu } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { Navigate, Outlet, useLocation } from "react-router";
import ModeToggle from "../components/ModeTogle";
import MainHeader from "../components/ProfileSection";
import NotificationBell from "../components/NotificationBell";
import { useSelector } from "react-redux";

export default function DashboardPage() {
    const { token } = useSelector((state) => state.auth);
  
  const location = useLocation();

  // Redirect immediately if user is not authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top bar: title + controls */}
        <div className="flex items-center justify-between mt-8 px-4 pt-4 pb-2 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <SidebarTrigger>
              <button
                type="button"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SidebarTrigger>

            <h1 className=" md:text-lg text-base font-semibold">DPL</h1>
          </div>

          {/* rightside controls */}
          <div className="flex items-center gap-4  md:mr-12">
            <NotificationBell />
            <ModeToggle />
            <MainHeader />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 pt-0">
          <div className="" />
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}