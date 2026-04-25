/**
 * Phase 8 - System Health Dashboard
 * Shows system health status, failed jobs, and queue status
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Server,
  Database,
  Mail,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  HardDrive,
  Users,
  FileText,
  Cpu,
} from "lucide-react";

const HealthBadge = ({ status, healthy }) => {
  if (healthy === true || status === "connected" || status === "configured" || status === "running") {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }
  if (healthy === false || status === "disconnected" || status === "error") {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
        <XCircle className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
      <AlertTriangle className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  );
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function SystemHealth() {
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const res = await api.get("/system-health");
      return res.data?.data;
    },
    staleTime: 30000,
  });

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["system-health-summary"],
    queryFn: async () => {
      const res = await api.get("/system-health/summary");
      return res.data?.data;
    },
    staleTime: 30000,
  });

  const { data: dbData, isLoading: dbLoading } = useQuery({
    queryKey: ["system-health-database"],
    queryFn: async () => {
      const res = await api.get("/system-health/database");
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["system-health-jobs"],
    queryFn: async () => {
      const res = await api.get("/system-health/jobs");
      return res.data?.data;
    },
    staleTime: 30000,
  });

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ["system-health-notifications"],
    queryFn: async () => {
      const res = await api.get("/system-health/notifications");
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const refetchAll = () => {
    refetchHealth();
    refetchSummary();
  };

  const overallStatus = healthData?.status || "unknown";
  const checks = healthData?.checks || {};

  return (
    <div className="min-h-screen p-4 dark:bg-gray-900 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
              System Health
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Monitor system status, jobs, and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={
                overallStatus === "healthy"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-base px-4 py-1"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-base px-4 py-1"
              }
            >
              {overallStatus === "healthy" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {overallStatus.toUpperCase()}
            </Badge>
            <Button variant="outline" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Database</p>
                  {summaryLoading ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <HealthBadge status={summaryData?.database} healthy={summaryData?.database === "connected"} />
                  )}
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {summaryLoading ? "..." : summaryData?.activeUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {summaryLoading ? "..." : formatUptime(summaryData?.uptime || 0)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Today's Events</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {summaryLoading ? "..." : summaryData?.todayAuditLogs || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Service Status
              </CardTitle>
              <CardDescription>Current status of system services</CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(checks)
                    .filter(([key]) => key !== "scheduledJobs")
                    .map(([key, check]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          {key === "database" && <Database className="h-5 w-5 text-blue-500" />}
                          {key === "email" && <Mail className="h-5 w-5 text-green-500" />}
                          {key === "push" && <Bell className="h-5 w-5 text-purple-500" />}
                          {key === "environment" && <HardDrive className="h-5 w-5 text-orange-500" />}
                          <div>
                            <p className="font-medium text-slate-700 dark:text-white">
                              {check.name}
                            </p>
                            {check.details?.missingOptional?.length > 0 && (
                              <p className="text-xs text-slate-500">
                                Optional: {check.details.missingOptional.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <HealthBadge status={check.status} healthy={check.healthy} />
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Memory Usage
              </CardTitle>
              <CardDescription>Server memory consumption</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600 dark:text-gray-300">Heap Used</span>
                      <span className="text-sm font-medium">
                        {formatBytes(summaryData?.memoryUsage?.heapUsed)}
                      </span>
                    </div>
                    <Progress
                      value={
                        summaryData?.memoryUsage?.heapTotal
                          ? (summaryData.memoryUsage.heapUsed / summaryData.memoryUsage.heapTotal) * 100
                          : 0
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      of {formatBytes(summaryData?.memoryUsage?.heapTotal)} total
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600 dark:text-gray-300">RSS</span>
                      <span className="text-sm font-medium">
                        {formatBytes(summaryData?.memoryUsage?.rss)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-gray-300">Node Version</span>
                      <span className="text-sm font-medium">{summaryData?.nodeVersion || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Scheduled Jobs
            </CardTitle>
            <CardDescription>Background task status and last run times</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobsData?.jobs?.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-800 dark:text-white">{job.name}</h4>
                      <HealthBadge status={job.status} healthy={job.status === "success"} />
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400">
                      {job.lastRun ? (
                        <span>Last run: {format(new Date(job.lastRun), "MMM d, HH:mm")}</span>
                      ) : (
                        <span>Never run</span>
                      )}
                    </div>
                    {job.errors?.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                        Last error: {job.errors[0]?.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>Collection sizes and storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            {dbLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <p className="text-sm text-slate-500">Collections</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      {dbData?.totalCollections || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <p className="text-sm text-slate-500">Documents</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      {dbData?.totalDocuments?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <p className="text-sm text-slate-500">Data Size</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      {formatBytes(dbData?.dataSize)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                    <p className="text-sm text-slate-500">Indexes</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">
                      {dbData?.indexes || 0}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {dbData?.collections?.slice(0, 15).map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-gray-800"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-white">
                        {col.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {col.documentCount.toLocaleString()} docs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Health (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                  <p className="text-sm text-slate-500">Total Sent</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {notifData?.totalNotifications?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                  <p className="text-sm text-slate-500">Unread</p>
                  <p className="text-xl font-bold text-orange-600">
                    {notifData?.unreadNotifications?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                  <p className="text-sm text-slate-500">Avg/Day</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {Math.round((notifData?.totalNotifications || 0) / (notifData?.period || 7))}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800">
                  <p className="text-sm text-slate-500">Read Rate</p>
                  <p className="text-xl font-bold text-green-600">
                    {notifData?.totalNotifications
                      ? Math.round(
                          ((notifData.totalNotifications - notifData.unreadNotifications) /
                            notifData.totalNotifications) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
