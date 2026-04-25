import React from "react";
import { Bell, CheckCircle, AlertCircle, Circle, Megaphone, Clock, ThumbsUp, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { useNavigate } from "react-router";

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "warning":
      return <AlertCircle className="w-4 h-4 text-amber-600" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case "approval":
      return <ThumbsUp className="w-4 h-4 text-purple-600" />;
    case "reminder":
      return <Clock className="w-4 h-4 text-cyan-600" />;
    case "announcement":
      return <Megaphone className="w-4 h-4 text-orange-600" />;
    default:
      return <Circle className="w-4 h-4 text-gray-400" />;
  }
}

export default function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", "header"],
    queryFn: async () => {
      const res = await api.get("/notifications", { params: { limit: 10 } });
      return res.data;
    },
    // Always consider stale so focus/open will refetch
    staleTime: 0,
    // Light polling to show new notifications without refresh
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const notifications = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const unreadItems = notifications.filter((n) => !n.read);
  const unread = unreadItems.length;

  const markAll = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "header"] }),
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to mark all read"),
  });

  const markOne = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "header"] }),
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to mark read"),
  });

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) refetch(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 py-0 text-[10px] bg-red-600 text-white">
              {unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unread === 0}
          >
            Mark all read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading && (
          <div className="px-3 py-2 text-sm text-gray-500">Loading…</div>
        )}

        {!isLoading && unread === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500">No new notifications</div>
        )}

        {!isLoading && unreadItems.map((n) => (
          <DropdownMenuItem
            key={n._id || n.id}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => markOne.mutate(n._id || n.id)}
          >
            {getNotificationIcon(n.type)}
            <div className="flex-1">
              <div className="text-sm font-medium">{n.title || n.message || "Notification"}</div>
              {n.message && n.title && (
                <div className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-1">{n.message}</div>
              )}
              {n.createdAt && (
                <div className="text-[11px] text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
              )}
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-center gap-2 cursor-pointer text-orange-500 hover:text-orange-400"
          onClick={() => {
            setOpen(false);
            navigate("/dashboard/notifications");
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="text-sm">View All Notifications</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
