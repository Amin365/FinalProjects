import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  Calendar,
  Building,
  GraduationCap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import api from "@/app/api/apislice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Needs Improvement": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];
const ALL_STATUS_VALUE = "__all_status__";
const ALL_DEPARTMENTS_VALUE = "__all_departments__";
const ALL_STUDY_YEARS_VALUE = "__all_study_years__";

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "text-orange-600" }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{trendValue}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReportingCenter() {
  const queryClient = useQueryClient();
  const user = useSelector((state) => state.auth?.user);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "",
    department: "",
    study_year: "",
  });
  const [isExporting, setIsExporting] = useState(false);
  const roleName = String(user?.role?.role || user?.role?.plural || user?.role || "").toLowerCase();
  const canReviewReports = /moderator|super\s*admin/i.test(roleName);

  const reviewMutation = useMutation({
    mutationFn: async ({ reportId, status }) => {
      const res = await api.patch(`/daily-reports/${reportId}/status`, { status });
      return res.data?.data || res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Report marked as ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: ["reporting", "admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["challenge"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update report status.");
    },
  });

  // Fetch monthly comparison
  const { data: comparisonData, isLoading: comparisonLoading, refetch: refetchComparison } = useQuery({
    queryKey: ["reporting", "monthly-comparison", filters.department, filters.study_year],
    queryFn: async () => {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;
      const res = await api.get("/reporting/monthly-comparison", { params });
      return res.data?.data || {};
    },
    staleTime: 60_000,
  });

  // Fetch department comparison
  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ["reporting", "department-comparison", filters.from, filters.to],
    queryFn: async () => {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await api.get("/reporting/department-comparison", { params });
      return res.data?.data || [];
    },
    staleTime: 60_000,
  });

  // Fetch top readers
  const { data: topReadersData, isLoading: topReadersLoading } = useQuery({
    queryKey: ["reporting", "top-readers", filters],
    queryFn: async () => {
      const params = { limit: 10 };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;
      const res = await api.get("/reporting/top-readers", { params });
      return res.data?.data || [];
    },
    staleTime: 60_000,
  });

  // Fetch weakest participation
  const { data: weakestData, isLoading: weakestLoading } = useQuery({
    queryKey: ["reporting", "weakest-participation", filters],
    queryFn: async () => {
      const params = { limit: 10 };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;
      const res = await api.get("/reporting/weakest-participation", { params });
      return res.data?.data || [];
    },
    staleTime: 60_000,
  });

  // Fetch reading health
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["reporting", "reading-health", filters.department, filters.study_year],
    queryFn: async () => {
      const params = { daysInactive: 7 };
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;
      const res = await api.get("/reporting/reading-health", { params });
      return res.data;
    },
    staleTime: 60_000,
  });

  // Fetch report quality
  const { data: qualityData, isLoading: qualityLoading } = useQuery({
    queryKey: ["reporting", "report-quality", filters],
    queryFn: async () => {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;
      const res = await api.get("/reporting/report-quality", { params });
      return res.data?.data || {};
    },
    staleTime: 60_000,
  });

  // Fetch admin reports
  const { data: adminReportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ["reporting", "admin-reports", filters],
    queryFn: async () => {
      const params = { limit: 50 };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;
      const res = await api.get("/reporting/admin-reports", { params });
      return res.data || { data: [], total: 0 };
    },
    staleTime: 60_000,
    enabled: activeTab === "reports",
  });

  const handleExportCSV = async (type) => {
    try {
      setIsExporting(true);
      const params = { type };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.status) params.status = filters.status;
      if (filters.department) params.department = filters.department;
      if (filters.study_year) params.study_year = filters.study_year;

      const res = await api.get("/reporting/export/csv", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export successful!");
    } catch (err) {
      toast.error("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ from: "", to: "", status: "", department: "", study_year: "" });
  };

  // Get unique departments from deptData
  const departments = useMemo(() => {
    return deptData?.map((d) => d.department).filter(Boolean) || [];
  }, [deptData]);

  // Format rating distribution for pie chart
  const ratingChartData = useMemo(() => {
    if (!qualityData?.ratingDistribution) return [];
    return Object.entries(qualityData.ratingDistribution).map(([key, value]) => ({
      name: `${key} Star${key !== "1" ? "s" : ""}`,
      value,
    }));
  }, [qualityData]);

  const isLoading = comparisonLoading || deptLoading || topReadersLoading || weakestLoading || healthLoading || qualityLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-orange-600" />
            Admin Reporting Center
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive analytics and reporting dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportCSV("reports")}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Export Reports
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportCSV("leaderboard")}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Leaderboard
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange("from", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange("to", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => handleFilterChange("status", v === ALL_STATUS_VALUE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS_VALUE}>All Status</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={filters.department}
                onValueChange={(v) => handleFilterChange("department", v === ALL_DEPARTMENTS_VALUE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_DEPARTMENTS_VALUE}>All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Study Year</Label>
              <Select
                value={filters.study_year}
                onValueChange={(v) => handleFilterChange("study_year", v === ALL_STUDY_YEARS_VALUE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STUDY_YEARS_VALUE}>All Years</SelectItem>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                  <SelectItem value="5">5th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={clearFilters} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs className="mb-8" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Monthly Stats */}
          {comparisonData?.currentMonth && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Reports"
                value={comparisonData.currentMonth.totalReports}
                subtitle={`${comparisonData.currentMonth.name} ${comparisonData.currentMonth.year}`}
                icon={FileText}
                trend={comparisonData.changes?.reportsChange >= 0 ? "up" : "down"}
                trendValue={Math.abs(comparisonData.changes?.reportsChange || 0)}
              />
              <StatCard
                title="Pages Read"
                value={comparisonData.currentMonth.pagesRead?.toLocaleString()}
                subtitle="This month"
                icon={BookOpen}
                trend={comparisonData.changes?.pagesChange >= 0 ? "up" : "down"}
                trendValue={Math.abs(comparisonData.changes?.pagesChange || 0)}
              />
              <StatCard
                title="Active Readers"
                value={comparisonData.currentMonth.uniqueReaders}
                subtitle="Unique contributors"
                icon={Users}
                trend={comparisonData.changes?.readersChange >= 0 ? "up" : "down"}
                trendValue={Math.abs(comparisonData.changes?.readersChange || 0)}
              />
              <StatCard
                title="Avg Rating"
                value={comparisonData.currentMonth.avgRating?.toFixed(1) || "N/A"}
                subtitle="Report quality"
                icon={Star}
              />
            </div>
          )}

          {/* Top Readers & Weakest Participation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Readers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Readers
                </CardTitle>
                <CardDescription>Members with highest reading activity</CardDescription>
              </CardHeader>
              <CardContent>
                {topReadersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Reports</TableHead>
                        <TableHead className="text-right">Pages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topReadersData?.slice(0, 5).map((reader, idx) => (
                        <TableRow key={reader.user?._id || idx}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {reader.user?.first_name} {reader.user?.last_name}
                              </span>
                              {reader.user?.department && (
                                <span className="text-xs text-muted-foreground">
                                  {reader.user.department}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{reader.reportsCount}</TableCell>
                          <TableCell className="text-right">{reader.pagesRead?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Weakest Participation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                  Needs Attention
                </CardTitle>
                <CardDescription>Members with lowest participation</CardDescription>
              </CardHeader>
              <CardContent>
                {weakestLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Reports</TableHead>
                        <TableHead className="text-right">Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weakestData?.slice(0, 5).map((member, idx) => (
                        <TableRow key={member.user?._id || idx}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{member.member?.name || "Unknown"}</span>
                              {member.member?.department && (
                                <span className="text-xs text-muted-foreground">
                                  {member.member.department}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={member.reportsCount === 0 ? "destructive" : "secondary"}>
                              {member.reportsCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {member.daysSinceLastReport
                              ? `${member.daysSinceLastReport}d ago`
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Quality */}
          {qualityData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Report Quality Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">{qualityData.avgRating?.toFixed(2) || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">{qualityData.avgTimeSpent?.toFixed(0) || 0}</p>
                      <p className="text-sm text-muted-foreground">Avg Minutes</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">{qualityData.avgPagesRead?.toFixed(0) || 0}</p>
                      <p className="text-sm text-muted-foreground">Avg Pages</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">{qualityData.totalApprovedReports || 0}</p>
                      <p className="text-sm text-muted-foreground">Approved Reports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ratingChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {ratingChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6 mt-4">
          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Comparison
              </CardTitle>
              <CardDescription>Current month vs previous month performance</CardDescription>
            </CardHeader>
            <CardContent>
              {comparisonLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              ) : comparisonData?.currentMonth && comparisonData?.previousMonth ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{comparisonData.currentMonth.name} {comparisonData.currentMonth.year}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{comparisonData.currentMonth.totalReports}</p>
                        <p className="text-xs text-muted-foreground">Total Reports</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{comparisonData.currentMonth.pagesRead?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Pages Read</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{comparisonData.currentMonth.uniqueReaders}</p>
                        <p className="text-xs text-muted-foreground">Active Readers</p>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{comparisonData.currentMonth.avgRating?.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-muted-foreground">{comparisonData.previousMonth.name} {comparisonData.previousMonth.year}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{comparisonData.previousMonth.totalReports}</p>
                        <p className="text-xs text-muted-foreground">Total Reports</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{comparisonData.previousMonth.pagesRead?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Pages Read</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{comparisonData.previousMonth.uniqueReaders}</p>
                        <p className="text-xs text-muted-foreground">Active Readers</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{comparisonData.previousMonth.avgRating?.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Department Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Comparison
              </CardTitle>
              <CardDescription>Reading activity across departments</CardDescription>
            </CardHeader>
            <CardContent>
              {deptLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              ) : deptData?.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalReports" fill="#f97316" name="Reports" />
                        <Bar dataKey="activeReaders" fill="#3b82f6" name="Active Readers" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                        <TableHead className="text-right">Reports</TableHead>
                        <TableHead className="text-right">Pages</TableHead>
                        <TableHead className="text-right">Avg Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deptData.map((dept) => (
                        <TableRow key={dept.department}>
                          <TableCell className="font-medium">{dept.department}</TableCell>
                          <TableCell className="text-right">{dept.totalMembers}</TableCell>
                          <TableCell className="text-right">{dept.activeReaders}</TableCell>
                          <TableCell className="text-right">{dept.totalReports}</TableCell>
                          <TableCell className="text-right">{dept.pagesRead?.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{dept.avgRating?.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No department data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6 mt-4">
          {/* Health Summary */}
          {healthData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Inactive Readers"
                value={healthData.summary.totalInactive}
                subtitle="No activity in 7+ days"
                icon={AlertTriangle}
                color="text-amber-600"
              />
              <StatCard
                title="Never Reported"
                value={healthData.summary.totalNoReports}
                subtitle="Members with no reports"
                icon={XCircle}
                color="text-red-600"
              />
              <StatCard
                title="Low Streak"
                value={healthData.summary.totalLowStreak}
                subtitle="Streak ≤ 2 days"
                icon={TrendingDown}
                color="text-purple-600"
              />
              <StatCard
                title="Overdue + Inactive"
                value={healthData.summary.totalOverdueInactive}
                subtitle="Need immediate attention"
                icon={AlertTriangle}
                color="text-red-600"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inactive Readers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Inactive Readers
                </CardTitle>
                <CardDescription>No reading activity for 7+ days</CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : healthData?.data?.inactiveReaders?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead className="text-right">Days Inactive</TableHead>
                        <TableHead className="text-right">Total Reports</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthData.data.inactiveReaders.slice(0, 10).map((item, idx) => (
                        <TableRow key={item.user?._id || idx}>
                          <TableCell>
                            <span className="font-medium">{item.member?.name || "Unknown"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{item.daysSinceReport}d</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.totalReports}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No inactive readers found</p>
                )}
              </CardContent>
            </Card>

            {/* Never Reported */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Never Reported
                </CardTitle>
                <CardDescription>Members who haven't submitted any reports</CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : healthData?.data?.noReports?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthData.data.noReports.slice(0, 10).map((item, idx) => (
                        <TableRow key={item.user?._id || idx}>
                          <TableCell className="font-medium">{item.member?.name || "Unknown"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.member?.department || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">All members have submitted reports</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overdue + Inactive */}
          {healthData?.data?.overdueInactive?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Overdue Books + Inactive Readers
                </CardTitle>
                <CardDescription>Critical: Members with overdue books who are also inactive</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthData.data.overdueInactive.map((item, idx) => (
                      <TableRow key={item._id || idx}>
                        <TableCell className="font-medium">
                          {item.member?.first_name} {item.member?.last_name}
                        </TableCell>
                        <TableCell>{item.book?.title || "Unknown"}</TableCell>
                        <TableCell>{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daily Reports
              </CardTitle>
              <CardDescription>
                {adminReportsData?.total || 0} reports found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              ) : adminReportsData?.data?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead className="text-right">Pages</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead>Status</TableHead>
                      {canReviewReports && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminReportsData.data.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell className="text-sm">
                          {new Date(report.readingDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {report.createdBy?.first_name} {report.createdBy?.last_name}
                            </span>
                            {report.memberDepartment && (
                              <span className="text-xs text-muted-foreground">
                                {report.memberDepartment}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {report.book?.title || "Unknown"}
                        </TableCell>
                        <TableCell className="text-right">
                          {report.pagesRead || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {report.timeSpent}m
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {report.rating}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[report.status] || ""}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        {canReviewReports && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewMutation.isPending || report.status === "Approved"}
                                onClick={() => reviewMutation.mutate({ reportId: report._id, status: "Approved" })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewMutation.isPending || report.status === "Needs Improvement"}
                                onClick={() => reviewMutation.mutate({ reportId: report._id, status: "Needs Improvement" })}
                              >
                                Needs work
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No reports found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
