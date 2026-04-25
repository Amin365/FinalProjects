import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Search as SearchIcon,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Filter,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImportExcelModal from "./ImportExcelModel";

/* ── API helpers ── */
const fetchMembers = async ({ queryKey }) => {
  const [, params] = queryKey;
  const {
    page = 1,
    limit = 10,
    searchTerm = "",
    region = "",
    city = "",
    status = "",
    department = "",
    study_year = "",
    moderatorId: modFilter = "",
    scopedModeratorId = null,
  } = params || {};

  // If we need to scope to a specific moderator's assigned members
  if (scopedModeratorId) {
    const res = await api.get(`/moderators/${scopedModeratorId}/members`);
    let arr = res.data?.data ?? [];
    if (arr.length > 0 && arr[0].member) {
      arr = arr.map((a) => a.member ?? a);
    }
    return { data: arr, total: arr.length, totalPages: Math.max(1, Math.ceil((arr.length || 0) / limit)) };
  }

  const queryParams = { page, limit };
  if (searchTerm) queryParams.q = searchTerm;
  if (region && region !== "All") queryParams.region = region;
  if (city && city !== "All") queryParams.city = city;
  if (status && status !== "All") queryParams.status = status;
  if (department && department !== "All") queryParams.department = department;
  if (study_year && study_year !== "All") queryParams.study_year = study_year;
  if (modFilter && modFilter !== "All") queryParams.moderator = modFilter;

  const res = await api.get("/members", { params: queryParams });
  return {
    data: res.data?.data ?? [],
    total: res.data?.total ?? 0,
    totalPages: res.data?.totalPages ?? 1,
  };
};

const fetchModerators = async () => {
  const res = await api.get("/moderators");
  return res.data?.data ?? [];
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

const StatusPill = ({ status = "Active" }) => {
  const map = {
    Active: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800",
    Inactive: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-800",
  };
  const classes = map[status] ?? "bg-muted text-foreground border-border";
  return <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", classes)}>{status}</span>;
};

export default function MemberTable() {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterStudyYear, setFilterStudyYear] = useState("All");
  const [filterModerator, setFilterModerator] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const urlModeratorId = urlParams.get("moderatorId");

  const authUser = useSelector((s) => s.auth.user);
  const userRoleName = (authUser?.role?.role || authUser?.role?.plural || "").toLowerCase();
  const userIsModerator = /moderator/i.test(userRoleName);

  const scopedModeratorId = urlModeratorId || (userIsModerator ? authUser?._id : null);

  // Fetch moderators for filter dropdown
  const { data: moderatorsData } = useQuery({
    queryKey: ["moderators-for-filter"],
    queryFn: fetchModerators,
    staleTime: 60_000,
    enabled: !userIsModerator,
  });
  const moderators = moderatorsData ?? [];

  const filterParams = {
    page: currentPage,
    limit,
    searchTerm,
    region: filterRegion,
    city: filterCity,
    status: filterStatus,
    department: filterDepartment,
    study_year: filterStudyYear,
    moderatorId: filterModerator,
    scopedModeratorId,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["members", filterParams],
    queryFn: fetchMembers,
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const members = data?.data ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / limit) : 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRegion, filterCity, filterStatus, filterDepartment, filterStudyYear, filterModerator]);

  // Derive unique values for local filter options
  const regions = useMemo(() => ["All", ...Array.from(new Set(members.map((m) => m.region).filter(Boolean)))], [members]);
  const cities = useMemo(() => ["All", ...Array.from(new Set(members.map((m) => m.city).filter(Boolean)))], [members]);
  const departments = useMemo(() => ["All", ...Array.from(new Set(members.map((m) => m.department).filter(Boolean)))], [members]);

  const hasActiveFilters =
    filterRegion !== "All" ||
    filterCity !== "All" ||
    filterStatus !== "All" ||
    filterDepartment !== "All" ||
    filterStudyYear !== "All" ||
    filterModerator !== "All";

  const clearFilters = () => {
    setFilterRegion("All");
    setFilterCity("All");
    setFilterStatus("All");
    setFilterDepartment("All");
    setFilterStudyYear("All");
    setFilterModerator("All");
  };

  const handleRowClick = (id) => navigate(`/dashboard/members/${id}`);
  const handleAddNew = () => navigate("/dashboard/members/new");

  const handleExportExcel = () => {
    const rows = members.map((m) => ({
      FullName: `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim(),
      FirstName: m.first_name ?? "",
      MiddleName: m.middle_name ?? "",
      LastName: m.last_name ?? "",
      Email: m.email ?? "",
      Phone: m.phone ?? "",
      Code: m.code ?? "",
      Region: m.region ?? "",
      City: m.city ?? "",
      Department: m.department ?? "",
      StudyYear: m.study_year ?? "",
      Status: m.status ?? "",
      JoinDate: formatDate(m.join_date),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "members-export.xlsx");
  };

  const handlePageChange = (newPage) => {
    if (!isLoading && !isFetching && newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [showmodelExcel, setModelExcell] = useState(false);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * limit, totalItems);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 p-4 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-sm mt-1 text-muted-foreground">Manage club members and their profiles.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:flex">
          <Button variant="default" className="dark:bg-orange-600" onClick={() => setModelExcell(true)}>
            <FileSpreadsheet size={16} /> <span className="ml-2">Import Excel</span>
          </Button>
          <Button variant="default" className="dark:bg-orange-600" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> <span className="ml-2">Export Excel</span>
          </Button>
          <Button onClick={handleAddNew} className="dark:bg-orange-600">
            <Plus size={16} /> <span className="ml-2">Add Member</span>
          </Button>
        </div>
      </div>

      {/* Search + Filter toggle */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input className="pl-10" placeholder="Search by name, email or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className={cn("gap-1", hasActiveFilters && "border-orange-400 text-orange-600")}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 bg-orange-500 text-white rounded-full text-[10px] px-1.5 py-0.5">
                  ON
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-slate-500">
                <X size={13} /> Clear
              </Button>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-foreground">{totalItems}</span>
          </div>
        </CardContent>

        {/* Expanded filter panel */}
        {showFilters && (
          <CardContent className="pt-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 border-t">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Region</label>
              <Select onValueChange={setFilterRegion} value={filterRegion}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => <SelectItem key={r} value={r}>{r === "All" ? "All Regions" : r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <Select onValueChange={setFilterCity} value={filterCity}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c === "All" ? "All Cities" : c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select onValueChange={setFilterStatus} value={filterStatus}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {["All", "Active", "Inactive", "pending"].map((s) => (
                    <SelectItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Department</label>
              <Select onValueChange={setFilterDepartment} value={filterDepartment}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d === "All" ? "All Departments" : d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Study Year</label>
              <Select onValueChange={setFilterStudyYear} value={filterStudyYear}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {["All", "1", "2", "3", "4", "5"].map((y) => (
                    <SelectItem key={y} value={y}>{y === "All" ? "All Years" : `Year ${y}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!userIsModerator && moderators.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Moderator</label>
                <Select onValueChange={setFilterModerator} value={filterModerator}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Moderators</SelectItem>
                    {moderators.map((mod) => (
                      <SelectItem key={mod._id} value={mod._id}>
                        {mod.first_name} {mod.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b z-10 bg-muted/60 border-border">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground">Member</th>
                <th className="p-4 font-semibold text-muted-foreground">Code</th>
                <th className="p-4 font-semibold text-muted-foreground">Department</th>
                <th className="p-4 font-semibold text-muted-foreground">Region</th>
                <th className="p-4 font-semibold text-muted-foreground">Joined</th>
                <th className="p-4 font-semibold text-muted-foreground">Status</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m._id ?? m.id} onClick={() => handleRowClick(m._id ?? m.id)} className="group cursor-pointer hover:bg-muted/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    {m.Profile_picture ? (
                      <Avatar className="w-10 h-10 rounded-md">
                        <AvatarImage src={m.Profile_picture} alt={m.first_name || "Profile"} />
                        <AvatarFallback>{(m.first_name?.[0] ?? "").toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center font-medium text-white shadow-sm bg-gradient-to-br from-orange-500 to-indigo-600")}>
                        {(m.first_name?.[0] ?? "").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{m.first_name} {m.last_name}</div>
                      <div className="text-xs text-muted-foreground">{m.email || m.phone || "No contact"}</div>
                    </div>
                  </td>

                  <td className="p-4">{m.code}</td>
                  <td className="p-4">{m.department || "—"}</td>
                  <td className="p-4">{m.region || "N/A"}</td>
                  <td className="p-4">{formatDate(m.join_date)}</td>

                  <td className="p-4">
                    <StatusPill status={m.status || "Active"} />
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end group-hover:opacity-100 transition-opacity gap-2">
                      <span className="text-xs text-muted-foreground font-medium px-2">View Details</span>
                      <ArrowLeft className="rotate-180 text-muted-foreground" size={16} />
                    </div>
                  </td>
                </tr>
              ))}

              {isLoading && (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Loading members...</td></tr>
              )}

              {!isLoading && members.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No members found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-border bg-card gap-4">
          <p className="text-sm md:block hidden text-muted-foreground whitespace-nowrap">
            {totalItems === 0
              ? "Showing 0 results"
              : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
          </p>

          <div className="flex items-center ml-12 gap-2 whitespace-nowrap">
            <Button size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading || isFetching} className="flex items-center dark:bg-orange-600 gap-1 whitespace-nowrap">
              <ChevronLeft size={16} /> Previous
            </Button>

            <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-muted text-foreground whitespace-nowrap">
              {currentPage} / {totalPages}
            </span>

            <Button size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0 || isLoading || isFetching} className="flex items-center dark:bg-orange-600 gap-1 whitespace-nowrap">
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      <ImportExcelModal isOpen={showmodelExcel} onClose={() => setModelExcell(false)} />
    </div>
  );
}
