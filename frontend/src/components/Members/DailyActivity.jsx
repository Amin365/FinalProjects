import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import api from "@/app/api/apislice";

import {
  Flame,
  Bolt,
  Star,
  Calendar as CalendarIcon,
  User as UserIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import api from '../../app/api/apislice';
const DAY = 24 * 60 * 60 * 1000;

const startOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const toISO = (d) => startOfDay(d).toISOString().slice(0, 10);

const fmtMonthTitle = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const fmtDayLabel = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const isWeekend = (d) => {
  const day = new Date(d).getDay();
  return day === 0 || day === 6;
};

const buildPeriod = ({ month }) => {
  const now = new Date();
  const year = now.getFullYear();
  const m = month ?? now.getMonth(); // 0-11
  const start = new Date(year, m, 1);
  const end = new Date(year, m + 1, 0);
  return { start, end };
};

const buildGridDays = (start, end) => {
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
};

const calcLongestStreakFromSet = (dateSet, gridDays) => {
  let maxStreak = 0;
  let current = 0;
  for (const day of gridDays) {
    const key = toISO(day);
    if (dateSet.has(key)) {
      current += 1;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 0;
    }
  }
  return maxStreak;
};

const memberLabel = (m) => {
  const name =
    m.full_name ||
    [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" ");
  return m.code ? `${name} (${m.code})` : name || m.email || m._id;
};

export default function DailyReportActivityDashboard() {
  const [month, setMonth] = useState(new Date().getMonth().toString());
  const monthNumber = Number(month);

  const [memberId, setMemberId] = useState("");

  const period = useMemo(() => buildPeriod({ month: monthNumber }), [monthNumber]);
  const gridDays = useMemo(() => buildGridDays(period.start, period.end), [period]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const from = useMemo(() => toISO(period.start), [period.start]);
  const to = useMemo(() => toISO(period.end), [period.end]);

  // 1) Fetch members list (admin/moderator dropdown)
  const { data: members = [], isLoading: membersLoading, isError: membersError } = useQuery({
    queryKey: ["members", "list"],
    queryFn: () => api.get("/members/list"),
    select: (r) => r.data?.data ?? [],
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // default member selection
  useEffect(() => {
    if (!memberId && members.length) setMemberId(String(members[0]._id));
  }, [memberId, members]);

  // 2) Fetch scoped reports by member & month range
  // This endpoint must apply role rules:
  // - super admin => any member
  // - moderator => only assigned members
  const {
    data: reports = [],
    isLoading: reportsLoading,
    isError: reportsError,
  } = useQuery({
    queryKey: ["daily-reports", "scope", memberId, from, to],
    enabled: Boolean(memberId),
    queryFn: () =>
      api.get("/daily-reports/scope", {
        params: { memberId, from, to, limit: 5000 },
      }),
    select: (r) => r.data?.data ?? [],
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  // member reports for heatmap are already filtered by endpoint,
  // but keep this in case endpoint returns multi-user for that member
  const selectedMemberReports = useMemo(() => {
    const startMs = startOfDay(period.start).getTime();
    const endMs = startOfDay(new Date(period.end.getTime() + DAY)).getTime();
    return reports.filter((r) => {
      const t = r?.readingDate ? new Date(r.readingDate).getTime() : 0;
      return t >= startMs && t < endMs;
    });
  }, [reports, period]);

  const heatmapData = useMemo(() => {
    const data = {};
    for (const day of gridDays) data[toISO(day)] = 0;

    for (const r of selectedMemberReports) {
      const key = toISO(new Date(r.readingDate));
      if (Object.prototype.hasOwnProperty.call(data, key)) data[key] += 1;
    }
    return data;
  }, [selectedMemberReports, gridDays]);

  const streak = useMemo(() => {
    const set = new Set();
    for (const r of selectedMemberReports) set.add(toISO(new Date(r.readingDate)));
    return calcLongestStreakFromSet(set, gridDays);
  }, [selectedMemberReports, gridDays]);

  
  const {
    data: scopeAllReports = [],
  } = useQuery({
    queryKey: ["daily-reports", "scope-all", from, to],
    queryFn: () => api.get("/daily-reports/scope", { params: { from, to, limit: 5000 } }),
    select: (r) => r.data?.data ?? [],
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const bestReader = useMemo(() => {
  
    const stats = new Map(); 

    for (const r of scopeAllReports) {
      const u = r.createdBy;
      const mid = u?.member ? String(u.member) : null;
      if (!mid) continue;

      // Prefer human name, avoid showing member codes/ids
      const name =
        [u?.first_name, u?.middle_name, u?.last_name].filter(Boolean).join(" ") ||
        u?.username ||
        "Unknown";

      if (!stats.has(mid)) stats.set(mid, { id: mid, name, totalReports: 0, days: new Set() });

      const s = stats.get(mid);
      s.totalReports += 1;
      s.days.add(toISO(new Date(r.readingDate)));
    }

    let top = null;
    for (const s of stats.values()) {
      const sStreak = calcLongestStreakFromSet(s.days, gridDays);
      const candidate = { ...s, streak: sStreak, totalDays: s.days.size };

      if (
        !top ||
        candidate.totalReports > top.totalReports ||
        (candidate.totalReports === top.totalReports && candidate.streak > top.streak)
      ) {
        top = candidate;
      }
    }
    return top;
  }, [scopeAllReports, gridDays]);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const startDay = period.start.getDay();
  const emptyCount = (startDay - 1 + 7) % 7;

  const streakIcon = streak >= 7 ? Flame : streak >= 3 ? Bolt : streak > 0 ? Star : null;
  const StreakIcon = streakIcon;

  if (membersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Reporting Activity</CardTitle>
        </CardHeader>
        <CardContent>Failed to load members list.</CardContent>
      </Card>
    );
  }

  if (reportsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Reporting Activity</CardTitle>
        </CardHeader>
        <CardContent>Failed to load reports (scope).</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="@container/card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Daily Reading Report Activity Dashboard</CardTitle>
          <div className="text-sm text-muted-foreground">
            Track member report submissions, streaks, and top performer • {fmtMonthTitle(period.start)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={memberId} onValueChange={setMemberId} disabled={membersLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={membersLoading ? "Loading..." : "Select member"} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={String(m._id)}>
                      {memberLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {new Date(0, i).toLocaleString("en", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Top Performer</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                {bestReader ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{bestReader.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reports: <span className="font-medium">{bestReader.totalReports}</span> • Longest streak:{" "}
                      <span className="font-medium">{bestReader.streak}</span> days
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Daily Reporting Activity</div>
              <div className="text-sm text-muted-foreground">Member submissions by day</div>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {StreakIcon ? <StreakIcon className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
              Current streak: <span className="font-semibold text-foreground">{streak}</span> days
            </div>
          </div>

          {/* Heatmap */}
          <div className="space-y-2 mt-12">
            <div className="grid grid-cols-7 gap-2 max-w-[980px]">
              {dayNames.map((dn) => (
                <div key={dn} className="text-center text-xs font-medium text-muted-foreground">
                  {dn}
                </div>
              ))}

              {Array.from({ length: emptyCount }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 w-12" />
              ))}

              {gridDays.map((day) => {
                const key = toISO(day);
                const count = heatmapData[key] || 0;

                const d0 = startOfDay(day);
                const isFuture = d0.getTime() > today.getTime();
                const weekend = isWeekend(day);

                let bg = "bg-red-500";
                let text = "text-white";

                if (weekend) {
                  bg = "bg-slate-100 dark:bg-slate-800";
                  text = "text-foreground";
                } else if (isFuture) {
                  bg = "bg-black";
                  text = "text-white";
                } else if (count > 0) {
                  bg = "bg-green-600";
                  text = "text-white";
                }

                return (
                  <div key={key} className="flex items-center justify-center py-4 ">
                    <div
                      title={`${day.toDateString()}: ${count} report${count !== 1 ? "s" : ""}`}
                      className={`h-12 w-12 rounded-md ${bg} ${text} flex items-center justify-center text-[10px] font-bold select-none`}
                    >
                      {fmtDayLabel(day)}

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-2 text-sm mt-8 mb-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-600" />
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span>Not submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-black" />
                <span>Future</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-800 border" />
                <span>Weekend (free)</span>
              </div>

              <div className="ml-auto text-xs text-muted-foreground">
                Auto refresh every 10 seconds
              </div>
            </div>
          </div>

          {/* quick summary */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Reports this month</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {reportsLoading ? "..." : selectedMemberReports.length}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Days submitted</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {reportsLoading ? "..." : Object.values(heatmapData).filter((n) => n > 0).length}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Longest streak</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {reportsLoading ? "..." : streak}
              </CardContent>
            </Card>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}