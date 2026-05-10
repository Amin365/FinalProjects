import { useMemo, useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import DesktopLauncher from "../components/desktop/DesktopLauncher";
import { DesktopPermissions } from "../components/desktop/DesktopPermissions";
import ModeToggle from "../components/ModeTogle";
import MainHeader from "../components/ProfileSection";
import NotificationBell from "../components/NotificationBell";
import { setDesktopLauncher } from "../app/CommonnSlice";
import api from "../app/api/apislice";

function DesktopChatButton({ onOpenChat }) {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["chat-unread-count", "desktop-header"],
    queryFn: async () => {
      const res = await api.get("/chats/contacts");
      return res.data;
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const contacts = Array.isArray(data?.data) ? data.data : [];
  const unread = contacts.reduce((sum, contact) => sum + Number(contact?.unread || 0), 0);

  return (
    <button
      type="button"
      onClick={() => {
        onOpenChat?.();
        navigate("/dashboard/chats");
      }}
      className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800 sm:flex"
      aria-label="Open chat"
      title="Open chat"
    >
      <MessageCircle className="h-5 w-5" />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </button>
  );
}

function DesktopTopBar({
  activeModule,
  showLauncher,
  onShowLauncher,
  onCloseDesktop,
  onOpenChat,
}) {
  return (
    <div className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-100 dark:shadow-[0_12px_30px_rgba(15,23,42,0.24)]">
      <div className="flex min-w-0 items-center gap-3">
        {showLauncher ? (
          <button
            type="button"
            onClick={onCloseDesktop}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:scale-105 hover:bg-red-400"
            aria-label="Close desktop dashboard"
            title="Close desktop dashboard"
          >
            <X className="h-6 w-6" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onShowLauncher}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg transition hover:scale-105 hover:bg-orange-400"
            aria-label="Back to desktop launcher"
            title="Back to desktop launcher"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm dark:bg-slate-950/40 dark:text-slate-200">
            Home
          </span>
          {!showLauncher && activeModule?.name ? (
            <span className="truncate rounded-md bg-orange-500 px-3 py-2 text-sm font-bold text-white">
              {activeModule.name}
            </span>
          ) : null}
        </div>
      </div>

      <div className=" flex items-center gap-3">
        <ModeToggle className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800" />
        <DesktopChatButton onOpenChat={onOpenChat} />
        <NotificationBell triggerClassName="border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800" />
        <div className="rounded-full border border-slate-300 bg-white p-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
          <MainHeader />
        </div>
      </div>
    </div>
  );
}

function DesktopIconRail({ modules, activeModule, onSelectModule }) {
  return (
    <aside className="sticky top-[72px] h-[calc(100svh-72px)] w-[68px] shrink-0 overflow-visible  py-3 shadow-[12px_0_30px_rgba(15,23,42,0.2)] ">
      <nav className="flex flex-col items-center gap-4 px-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const active = activeModule?.link === module.link;

          return (
            <NavLink
              key={module.link || module.name}
              to={module.link}
              onClick={() => onSelectModule(module)}
              title={module.name}
              className={[
                "group relative flex h-11 w-11 items-center justify-center rounded-full transition",
                active
                  ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/40"
                  : "bg-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white",
              ].join(" ")}
            >
              {Icon ? <Icon className="h-5 w-5" /> : null}
              <span className="pointer-events-none absolute left-[54px] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-xl group-hover:block">
                {module.name}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default function DashboardPage() {
  const { token, user } = useSelector((state) => state.auth);
  const desktopLauncher = useSelector((state) => state.common.desktopLauncher);
  const dispatch = useDispatch();
  const [showDesktopLauncher, setShowDesktopLauncher] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const location = useLocation();

  const desktopModules = useMemo(() => DesktopPermissions(user), [user]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (desktopLauncher) {
    return (
      <div className="min-h-svh  text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <DesktopTopBar
          activeModule={activeModule}
          showLauncher={showDesktopLauncher}
          onShowLauncher={() => setShowDesktopLauncher(true)}
          onCloseDesktop={() => dispatch(setDesktopLauncher(false))}
          onOpenChat={() => {
            setActiveModule({ name: "Chat", link: "/dashboard/chats" });
            setShowDesktopLauncher(false);
          }}
        />

        {showDesktopLauncher ? (
          <DesktopLauncher
            onModuleOpen={(module) => {
              setActiveModule(module);
              setShowDesktopLauncher(false);
            }}
            onClose={() => setShowDesktopLauncher(false)}
          />
        ) : (
          <div className="flex min-h-[calc(100svh-72px)]  dark:bg-slate-950">
            <DesktopIconRail
              modules={desktopModules}
              activeModule={activeModule}
              onSelectModule={setActiveModule}
            />
            <main className="min-w-0 flex-1 overflow-x-hidden  dark:bg-slate-950">
              <div className="min-h-[calc(100svh-72px)] p-4 md:p-6">
                <Outlet />
              </div>
            </main>
          </div>
        )}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="mt-8 flex items-center justify-between px-4 pb-2 pt-4 lg:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger>
              <button
                type="button"
                className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SidebarTrigger>

            <h1 className="text-base font-semibold md:text-lg">DPL</h1>
          </div>

          <div className="flex items-center gap-4 md:mr-12">
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
