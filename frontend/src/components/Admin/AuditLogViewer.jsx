/**
 * Phase 8 - Audit Log Viewer Component
 * Displays audit logs with filtering and search capabilities
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";

const ACTION_COLORS = {
  created: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  updated: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  deleted: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  rejected: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  returned: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  login: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  logout: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const getActionColor = (action) => {
  for (const [key, value] of Object.entries(ACTION_COLORS)) {
    if (action?.includes(key)) return value;
  }
  return ACTION_COLORS.default;
};

const ENTITY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "Member", label: "Member" },
  { value: "Book", label: "Book" },
  { value: "Issue", label: "Issue" },
  { value: "JoinRequest", label: "Join Request" },
  { value: "Role", label: "Role" },
  { value: "Permission", label: "Permission" },
  { value: "User", label: "User" },
  { value: "Report", label: "Report" },
  { value: "Blog", label: "Blog" },
  { value: "Resource", label: "Resource" },
  { value: "Challenge", label: "Challenge" },
  { value: "Reservation", label: "Reservation" },
];

export default function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const limit = 25;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page, search, entityType],
    queryFn: async () => {
      const params = { page, limit };
      if (search) params.search = search;
      if (entityType !== "all") params.entityType = entityType;
      const res = await api.get("/audit-logs", { params });
      return res.data;
    },
    staleTime: 30000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["audit-logs-stats"],
    queryFn: async () => {
      const res = await api.get("/audit-logs/stats", { params: { days: 30 } });
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const logs = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
              Audit Log
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Track all system activities and changes
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Total Events (30d)</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {statsLoading ? "..." : statsData?.totalCount || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {statsLoading ? "..." : statsData?.activeUsers?.length || 0}
                  </p>
                </div>
                <User className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Top Action</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                    {statsLoading ? "..." : statsData?.actionCounts?.[0]?._id?.split(".")[1] || "N/A"}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Today's Events</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {statsLoading
                      ? "..."
                      : statsData?.dailyCounts?.find(
                          (d) => d._id === new Date().toISOString().split("T")[0]
                        )?.count || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by description, user, or entity..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activity Log</span>
              <span className="text-sm font-normal text-slate-500">
                {total} total entries
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id} className="hover:bg-slate-50 dark:hover:bg-gray-800">
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                              {log.userName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="text-sm">
                              <p className="font-medium text-slate-700 dark:text-white truncate max-w-[120px]">
                                {log.userName || "System"}
                              </p>
                              <p className="text-xs text-slate-500">{log.userRole || ""}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action?.split(".").join(" ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-slate-700 dark:text-white">
                              {log.entityType}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">
                              {log.entityLabel || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-slate-600 dark:text-gray-300 truncate">
                            {log.description || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Timestamp</p>
                  <p className="text-slate-800 dark:text-white">
                    {format(new Date(selectedLog.createdAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Action</p>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">User</p>
                  <p className="text-slate-800 dark:text-white">
                    {selectedLog.userName || "System"}
                  </p>
                  <p className="text-xs text-slate-500">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Role</p>
                  <p className="text-slate-800 dark:text-white">
                    {selectedLog.userRole || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Entity Type</p>
                  <p className="text-slate-800 dark:text-white">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Entity</p>
                  <p className="text-slate-800 dark:text-white">
                    {selectedLog.entityLabel || "—"}
                  </p>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Description</p>
                  <p className="text-slate-800 dark:text-white">{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Changes</p>
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    {Object.entries(selectedLog.changes).map(([field, change]) => (
                      <div key={field} className="text-sm">
                        <span className="font-medium text-slate-700 dark:text-white">{field}:</span>
                        <div className="ml-4 text-slate-600 dark:text-gray-300">
                          <span className="line-through text-red-500">
                            {JSON.stringify(change.from)}
                          </span>
                          {" → "}
                          <span className="text-green-500">{JSON.stringify(change.to)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Metadata</p>
                  <pre className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </div>
              )}

              {(selectedLog.ipAddress || selectedLog.userAgent) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium text-slate-500">IP Address</p>
                    <p className="text-slate-800 dark:text-white text-xs font-mono">
                      {selectedLog.ipAddress || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">User Agent</p>
                    <p className="text-slate-600 dark:text-gray-300 text-xs truncate">
                      {selectedLog.userAgent || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
