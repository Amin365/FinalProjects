import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Megaphone,
  Clock,
  ThumbsUp,
  Filter,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { extractArrayPayload } from "@/lib/utils";

const NOTIFICATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "info", label: "Info", icon: Info, color: "text-blue-500" },
  { value: "success", label: "Success", icon: CheckCircle, color: "text-green-500" },
  { value: "warning", label: "Warning", icon: AlertCircle, color: "text-amber-500" },
  { value: "error", label: "Error", icon: AlertCircle, color: "text-red-500" },
  { value: "approval", label: "Approval", icon: ThumbsUp, color: "text-purple-500" },
  { value: "reminder", label: "Reminder", icon: Clock, color: "text-cyan-500" },
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "text-orange-500" },
];

const NOTIFICATION_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "system", label: "System" },
  { value: "issue", label: "Issues" },
  { value: "report", label: "Reports" },
  { value: "challenge", label: "Challenges" },
  { value: "achievement", label: "Achievements" },
  { value: "goal", label: "Goals" },
  { value: "blog", label: "Blogs" },
  { value: "join", label: "Join Requests" },
  { value: "announcement", label: "Announcements" },
];

const READ_FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

function getNotificationIcon(type) {
  const typeConfig = NOTIFICATION_TYPES.find((t) => t.value === type);
  if (!typeConfig || !typeConfig.icon) {
    return <Bell className="w-5 h-5 text-gray-400" />;
  }
  const IconComponent = typeConfig.icon;
  return <IconComponent className={`w-5 h-5 ${typeConfig.color}`} />;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function NotificationSkeleton() {
  return (
    <div className="p-4 border-b border-zinc-800">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const { _id, title, message, type, category, read, createdAt, meta } = notification;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors ${
        !read ? "bg-zinc-900/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getNotificationIcon(type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${!read ? "text-white" : "text-zinc-400"}`}>
                {title || message || "Notification"}
              </p>
              {message && title && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{message}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onMarkRead(_id)}
                  title="Mark as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-500 hover:text-red-500"
                onClick={() => onDelete(_id)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {category || "system"}
            </Badge>
            <span className="text-[10px] text-zinc-600">{formatDate(createdAt)}</span>
            {!read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </div>
          {meta?.ctaUrl && (
            <a
              href={meta.ctaUrl}
              className="text-xs text-orange-500 hover:underline mt-2 inline-block"
            >
              {meta.ctaLabel || "View Details →"}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationCenter() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Build query params
  const queryParams = {
    page,
    limit,
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(categoryFilter !== "all" && { category: categoryFilter }),
    ...(readFilter === "read" && { read: "true" }),
    ...(readFilter === "unread" && { read: "false" }),
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["notifications", "center", queryParams],
    queryFn: async () => {
      const res = await api.get("/notifications", { params: queryParams });
      return res.data;
    },
    keepPreviousData: true,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["notifications", "stats"],
    queryFn: async () => {
      const res = await api.get("/notifications/stats");
      return res.data?.data;
    },
  });

  const notifications = extractArrayPayload(data);
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Marked as read");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to mark read"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to mark all read"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete"),
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: () => api.delete("/notifications/read"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All read notifications deleted");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete"),
  });

  const handleResetFilters = () => {
    setTypeFilter("all");
    setCategoryFilter("all");
    setReadFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-orange-500" />
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all your notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-2xl font-bold">{statsLoading ? "-" : statsData?.total || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Unread</p>
            <p className="text-2xl font-bold text-blue-500">
              {statsLoading ? "-" : statsData?.unread || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Read</p>
            <p className="text-2xl font-bold text-green-500">
              {statsLoading ? "-" : statsData?.read || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">This Page</p>
            <p className="text-2xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">Filters:</span>
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={(v) => { setReadFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {READ_FILTERS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || statsData?.unread === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteAllReadMutation.mutate()}
              disabled={deleteAllReadMutation.isPending || statsData?.read === 0}
              className="text-red-500 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-zinc-800">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Notifications ({total})</span>
            <span className="text-xs text-zinc-500 font-normal">
              Page {page} of {totalPages}
            </span>
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-zinc-800/50">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No notifications found</p>
              {(typeFilter !== "all" || categoryFilter !== "all" || readFilter !== "all") && (
                <Button variant="link" onClick={handleResetFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-zinc-800 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-zinc-400 px-3">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
