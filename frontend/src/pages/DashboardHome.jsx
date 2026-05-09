
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import {
  BookOpen,
  BookCheck,
  Users,
  UserCheck,
  AlertTriangle,
  ClipboardList,
  UserPlus,
  BookPlus,
  FileText,
  Clock,
  Activity,
  Star,
  TrendingUp,
  CheckCircle,
  Trophy,
  Award,
  ChevronRight,
  Calendar,
  Megaphone,
  FileChartColumn
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/app/api/apislice";
import ChartsDashboard from "./ChartsDashboard";
import { extractArrayPayload } from "@/lib/utils";
import { getRoleName } from "@/lib/permissions";

/*  helpers  */

const timeAgo = (date) => {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const asArray = (value) => extractArrayPayload(value);

const activityIcon = (type) => {
  const map = {
    member_created: <UserPlus className="h-4 w-4 text-blue-500" />,
    book_created: <BookPlus className="h-4 w-4 text-green-500" />,
    issue_created: <BookOpen className="h-4 w-4 text-orange-500" />,
    issue_returned: <BookCheck className="h-4 w-4 text-emerald-500" />,
    join_request: <UserPlus className="h-4 w-4 text-purple-500" />,
    daily_report: <ClipboardList className="h-4 w-4 text-cyan-500" />,
    blog_published: <FileText className="h-4 w-4 text-pink-500" />,
  };
  return map[type] ?? <Activity className="h-4 w-4 text-muted-foreground" />;
};

/*  sub-components  */

function StatCard({ title, value, icon: Icon, colorClass = "text-primary", loading }) {
  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ events, loading }) {
  const safeEvents = asArray(events);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!safeEvents.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {safeEvents.map((ev, i) => (
        <div key={i} className="flex items-start gap-3 border rounded-md p-3">
          <div className="mt-0.5 shrink-0">{activityIcon(ev.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{ev.label}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" /> {timeAgo(ev.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopProgramsList({ programs, loading }) {
  const safePrograms = asArray(programs);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!safePrograms.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">No programme enrollments yet.</p>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {safePrograms.map((program, i) => (
        <div key={program._id ?? program.programId ?? i} className="flex items-center gap-3 border rounded-md p-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{program.title || "Unknown programme"}</p>
            {program.status && (
              <p className="text-xs text-muted-foreground capitalize">{program.status}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {program.enrollmentCount ?? program.enrollments ?? 0} enrolled
          </Badge>
        </div>
      ))}
    </div>
  );
}

function PopularBooksList({ books, loading }) {
  const safeBooks = asArray(books);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-8 rounded shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!safeBooks.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">No issues recorded yet.</p>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {safeBooks.map((b, i) => (
        <div key={b._id ?? i} className="flex items-center gap-3 border rounded-md p-3">
          <div className="h-10 w-8 rounded bg-muted flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{b.title}</p>
            {b.author && (
              <p className="text-xs text-muted-foreground truncate">{b.author}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {b.availableCopies ?? 0}/{b.totalCopies ?? 0} available
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {b.issueCount} issued
          </Badge>
        </div>
      ))}
    </div>
  );
}

function PendingApprovals({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const joinReqs = asArray(data?.pendingJoinRequests);
  const overdue = asArray(data?.overdueIssues);
  const todayReports = asArray(data?.todayReports);
  const total = joinReqs.length + overdue.length + todayReports.length;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 py-4">
        <CheckCircle className="h-4 w-4" /> All caught up — nothing pending!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {joinReqs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Pending Join Requests ({joinReqs.length})
          </p>
          <div className="space-y-2">
            {joinReqs.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
              >
                <span className="font-medium truncate">{r.FullName}</span>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {overdue.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Overdue Issues ({overdue.length})
          </p>
          <div className="space-y-2">
            {overdue.map((i) => {
              const memberName = i.member
                ? `${i.member.first_name} ${i.member.last_name}`
                : "Unknown";
              return (
                <div
                  key={i._id}
                  className="flex items-center justify-between border border-destructive/30 rounded-md px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium truncate block">
                      {i.book?.title ?? "Unknown book"}
                    </span>
                    <span className="text-xs text-muted-foreground">{memberName}</span>
                  </div>
                  <Badge variant="destructive" className="ml-2 shrink-0 text-xs">
                    Overdue
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todayReports.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Today&apos;s Reports ({todayReports.length})
          </p>
          <div className="space-y-2">
            {todayReports.map((r) => {
              const name = r.createdBy
                ? `${r.createdBy.first_name} ${r.createdBy.last_name}`
                : "Unknown";
              return (
                <div
                  key={r._id}
                  className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {r.book?.title ?? ""}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                    {r.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/*  main page  */

// function ActiveChallengesWidget() {
//   const { data: challenges = [], isLoading } = useQuery({
//     queryKey: ["challenges", "active-widget"],
//     queryFn: async () => {
//       const res = await api.get("/challenges", { params: { status: "Active" } });
//       const list = extractArrayPayload(res.data);
//       return list.slice(0, 3);
//     },
//     staleTime: 120_000,
//   });

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <CardTitle className="flex items-center gap-2 text-base">
//             <Trophy className="h-5 w-5 text-yellow-400" />
//             Active Challenges
//           </CardTitle>
//           <Link
//             to="/dashboard/challenges"
//             className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
//           >
//             View all <ChevronRight className="h-3 w-3" />
//           </Link>
//         </div>
//         <CardDescription>Join a reading challenge</CardDescription>
//       </CardHeader>
//       <CardContent>
//         {isLoading ? (
//           <div className="space-y-2">
//             {Array.from({ length: 3 }).map((_, i) => (
//               <Skeleton key={i} className="h-12 w-full" />
//             ))}
//           </div>
//         ) : challenges.length === 0 ? (
//           <p className="text-sm text-muted-foreground py-3 text-center">No active challenges right now.</p>
//         ) : (
//           <div className="space-y-2">
//             {challenges.map((c) => (
//               <Link key={c._id} to={`/dashboard/challenges/${c._id}`}>
//                 <div className="flex items-center gap-3 border rounded-md p-3 hover:bg-muted/50 transition cursor-pointer">
//                   <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium truncate">{c.title}</p>
//                     <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
//                       <Calendar className="h-3 w-3" />
//                       <span>
//                         {c.endDate
//                           ? `Ends ${new Date(c.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
//                           : c.type}
//                       </span>
//                     </div>
//                   </div>
//                   <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 shrink-0">
//                     {c.type}
//                   </Badge>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// function RecentAchievementsWidget() {
//   const { data: myAchievements = [], isLoading } = useQuery({
//     queryKey: ["my-achievements-widget"],
//     queryFn: async () => {
//       const res = await api.get("/users/me/achievements");
//       const list = extractArrayPayload(res.data);
//       // Keep only unlocked entries (those with an unlockedAt date or a nested achievement object)
//       return [...list]
//         .filter((a) => a.unlockedAt || a.achievement)
//         .sort((a, b) => new Date(b.unlockedAt || b.createdAt || 0) - new Date(a.unlockedAt || a.createdAt || 0))
//         .slice(0, 3);
//     },
//     staleTime: 120_000,
//   });

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <CardTitle className="flex items-center gap-2 text-base">
//             <Award className="h-5 w-5 text-purple-400" />
//             My Achievements
//           </CardTitle>
//           <Link
//             to="/dashboard/achievements"
//             className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
//           >
//             View all <ChevronRight className="h-3 w-3" />
//           </Link>
//         </div>
//         <CardDescription>Recently unlocked badges</CardDescription>
//       </CardHeader>
//       <CardContent>
//         {isLoading ? (
//           <div className="space-y-2">
//             {Array.from({ length: 3 }).map((_, i) => (
//               <Skeleton key={i} className="h-12 w-full" />
//             ))}
//           </div>
//         ) : myAchievements.length === 0 ? (
//           <p className="text-sm text-muted-foreground py-3 text-center">No achievements yet. Keep reading!</p>
//         ) : (
//           <div className="space-y-2">
//             {myAchievements.map((a, i) => {
//               const ach = a.achievement || a;
//               return (
//                 <div key={ach._id ?? i} className="flex items-center gap-3 border rounded-md p-3">
//                   <span className="text-2xl leading-none shrink-0">{ach.icon || "🏅"}</span>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium truncate">{ach.title || ach.name}</p>
//                     {(a.unlockedAt || a.createdAt) && (
//                       <p className="text-xs text-muted-foreground mt-0.5">
//                         {new Date(a.unlockedAt || a.createdAt).toLocaleDateString(undefined, {
//                           month: "short",
//                           day: "numeric",
//                           year: "numeric",
//                         })}
//                       </p>
//                     )}
//                   </div>
//                   <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 shrink-0">
//                     ✓ Earned
//                   </Badge>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

/*  main page  */

const getProgramList = (data) => extractArrayPayload(data?.data || data);
const getEnrollmentList = (data) => extractArrayPayload(data?.data || data);

function RoleHeader({ eyebrow, title, description, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex dark:bg-orange-400 h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function EmptyRoleState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TeacherDashboardHome() {
  const programsQ = useQuery({
    queryKey: ["teacher-dashboard", "programs"],
    queryFn: async () => {
      const res = await api.get("/programs", { params: { page: 1, limit: 100, mine: true } });
      return res.data;
    },
    staleTime: 60_000,
  });

  const enrollmentsQ = useQuery({
    queryKey: ["teacher-dashboard", "enrollments"],
    queryFn: async () => {
      const res = await api.get("/enrollments", { params: { page: 1, limit: 100 } });
      return res.data;
    },
    staleTime: 60_000,
  });

  const attendanceQ = useQuery({
    queryKey: ["teacher-dashboard", "attendance-programs"],
    queryFn: async () => {
      const res = await api.get("/attendance/programs");
      return res.data;
    },
    retry: false,
    staleTime: 60_000,
  });

  const programs = getProgramList(programsQ.data);
  const enrollments = getEnrollmentList(enrollmentsQ.data);
  const attendancePrograms = getProgramList(attendanceQ.data);
  const pending = enrollments.filter((item) => item.status === "pending").length;
  const confirmed = enrollments.filter((item) => item.status === "confirmed").length;
  const activePrograms = programs.filter((item) => item.status === "active").length;

  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      <RoleHeader
        eyebrow="Teacher dashboard"
        title="Your programs and learners"
        description="Track the programs assigned to you, review new enrollment requests, and jump into attendance or resources without the admin dashboard noise."
        actionLabel="Open My Programs"
        actionTo="/dashboard/programmecards"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="My Programs" value={programs.length} icon={FileChartColumn} colorClass="text-blue-500" loading={programsQ.isLoading} />
        <StatCard title="Active Programs" value={activePrograms} icon={CheckCircle} colorClass="text-emerald-500" loading={programsQ.isLoading} />
        <StatCard title="Pending Enrollments" value={pending} icon={Clock} colorClass="text-yellow-500" loading={enrollmentsQ.isLoading} />
        <StatCard title="Confirmed Students" value={confirmed} icon={Users} colorClass="text-purple-500" loading={enrollmentsQ.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Enrollment Requests</CardTitle>
            <CardDescription>Students waiting for review in your assigned programs</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsQ.isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : enrollments.length ? (
              <div className="space-y-3">
                {enrollments.slice(0, 5).map((item) => (
                  <Link key={item._id} to={`/dashboard/enrollments/${item._id}`} className="flex items-center justify-between rounded-md border p-3 transition hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.formData?.firstName || "Learner"} {item.formData?.lastName || ""}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.programId?.title || "Program enrollment"}</p>
                    </div>
                    <Badge variant={item.status === "pending" ? "secondary" : "outline"}>{item.status}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyRoleState title="No enrollment requests yet" description="New public enrollments for your programs will appear here." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teaching Shortcuts</CardTitle>
            <CardDescription>Fast access to common teacher actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link className="rounded-lg border p-4 transition hover:bg-muted/50" to="/dashboard/enrollments">
              <UserCheck className="mb-3 h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold">Review enrollments</p>
              <p className="mt-1 text-xs text-muted-foreground">Approve or reject learner requests.</p>
            </Link>
            <Link className="rounded-lg border p-4 transition hover:bg-muted/50" to="/dashboard/attendance">
              <ClipboardList className="mb-3 h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold">Take attendance</p>
              <p className="mt-1 text-xs text-muted-foreground">{attendanceQ.isError ? "Attendance permission needed." : `${attendancePrograms.length} program${attendancePrograms.length === 1 ? "" : "s"} ready.`}</p>
            </Link>
            <Link className="rounded-lg border p-4 transition hover:bg-muted/50" to="/dashboard/resources">
              <BookOpen className="mb-3 h-5 w-5 text-orange-500" />
              <p className="text-sm font-semibold">Manage resources</p>
              <p className="mt-1 text-xs text-muted-foreground">Share files for your programs.</p>
            </Link>
            <Link className="rounded-lg border p-4 transition hover:bg-muted/50" to="/dashboard/announcements">
              <Megaphone className="mb-3 h-5 w-5 text-purple-500" />
              <p className="text-sm font-semibold">Message students</p>
              <p className="mt-1 text-xs text-muted-foreground">Send updates to your learners.</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboardHome() {
  const enrollmentsQ = useQuery({
    queryKey: ["student-dashboard", "my-enrollments"],
    queryFn: async () => {
      const res = await api.get("/users/me/enrollments");
      return res.data;
    },
    retry: false,
    staleTime: 60_000,
  });

  const programsQ = useQuery({
    queryKey: ["student-dashboard", "programs"],
    queryFn: async () => {
      const res = await api.get("/programs", { params: { page: 1, limit: 6 } });
      return res.data;
    },
    staleTime: 60_000,
  });

  const enrollments = getEnrollmentList(enrollmentsQ.data);
  const programs = getProgramList(programsQ.data);
  const pending = enrollments.filter((item) => item.status === "pending").length;
  const confirmed = enrollments.filter((item) => item.status === "confirmed").length;
  const waitlisted = enrollments.filter((item) => item.status === "waitlisted").length;

  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      <RoleHeader
        eyebrow="Student dashboard"
        title="Your learning space"
        description="Follow your program enrollments, browse available programs, and keep your library activity close at hand."
        actionLabel="Browse Programs"
        actionTo="/dashboard/programmecards"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="My Enrollments" value={enrollments.length} icon={ClipboardList} colorClass="text-blue-500" loading={enrollmentsQ.isLoading} />
        <StatCard title="Confirmed" value={confirmed} icon={CheckCircle} colorClass="text-emerald-500" loading={enrollmentsQ.isLoading} />
        <StatCard title="Pending" value={pending} icon={Clock} colorClass="text-yellow-500" loading={enrollmentsQ.isLoading} />
        <StatCard title="Waitlisted" value={waitlisted} icon={AlertTriangle} colorClass="text-orange-500" loading={enrollmentsQ.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Program Status</CardTitle>
            <CardDescription>Where your enrollments currently stand</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsQ.isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : enrollments.length ? (
              <div className="space-y-3">
                {enrollments.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.programId?.title || item.formData?.programTitle || "Program"}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.formData?.email || "Enrollment request"}</p>
                    </div>
                    <Badge variant={item.status === "confirmed" ? "default" : "secondary"}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyRoleState title="No enrollments yet" description="Choose a program and submit your enrollment request." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Programs</CardTitle>
            <CardDescription>Open learning options from the library</CardDescription>
          </CardHeader>
          <CardContent>
            {programsQ.isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : programs.length ? (
              <div className="space-y-3">
                {programs.slice(0, 5).map((program) => (
                  <Link key={program._id} to="/dashboard/programmecards" className="flex items-center justify-between rounded-md border p-3 transition hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{program.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{program.teacher?.fullName || "Program instructor"}</p>
                    </div>
                    <Badge variant="outline">{program.status}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyRoleState title="No programs available" description="Available programs will show here once published." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* <ActiveChallengesWidget />
        <RecentAchievementsWidget /> */}
      </div>
    </div>
  );
}

function RoleAwareDashboardHome() {
  const authUser = useSelector((state) => state.auth?.user);
  const roleName = getRoleName(authUser);

  if (roleName === "teacher" || roleName === "volunteer" || roleName === "library staff") {
    return <TeacherDashboardHome />;
  }

  if (roleName === "student" || roleName === "students") {
    return <StudentDashboardHome />;
  }

  return <AdminDashboardHome />;
}

function AdminDashboardHome() {
  const statsQ = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get("/dashboard/stats"),
    select: (r) => r.data,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const activityQ = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => api.get("/dashboard/activity"),
    select: (r) => r.data,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const topProgramsQ = useQuery({
    queryKey: ["dashboard", "top-programs"],
    queryFn: () => api.get("/dashboard/top-programs"),
    select: (r) => r.data,
    staleTime: 120_000,
  });

  const popularBooksQ = useQuery({
    queryKey: ["dashboard", "popular-books"],
    queryFn: () => api.get("/dashboard/popular-books"),
    select: (r) => r.data,
    staleTime: 120_000,
  });

  const pendingQ = useQuery({
    queryKey: ["dashboard", "pending-approvals"],
    queryFn: () => api.get("/dashboard/pending-approvals"),
    select: (r) => r.data,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const stats = statsQ.data;
  const statsLoading = statsQ.isLoading;

  const pendingTotal = useMemo(() => {
    const d = pendingQ.data;
    if (!d) return 0;
    return (
      (d.pendingJoinRequests?.length ?? 0) +
      (d.overdueIssues?.length ?? 0) +
      (d.todayReports?.length ?? 0)
    );
  }, [pendingQ.data]);

  return (
    <div className="space-y-6 px-4 lg:px-6 py-6">
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Books"
          value={stats?.totalBooks}
          icon={BookOpen}
          colorClass="text-blue-500"
          loading={statsLoading}
        />
        <StatCard
          title="Available Books"
          value={stats?.availableBooks}
          icon={BookCheck}
          colorClass="text-emerald-500"
          loading={statsLoading}
        />
        <StatCard
          title="Borrowed Books"
          value={stats?.borrowedBooks}
          icon={BookOpen}
          colorClass="text-orange-500"
          loading={statsLoading}
        />
        <StatCard
          title="Total Members"
          value={stats?.totalMembers}
          icon={Users}
          colorClass="text-purple-500"
          loading={statsLoading}
        />
        <StatCard
          title="Active Members"
          value={stats?.activeMembers}
          icon={UserCheck}
          colorClass="text-green-500"
          loading={statsLoading}
        />
        <StatCard
          title="Overdue Issues"
          value={stats?.overdueIssues}
          icon={AlertTriangle}
          colorClass="text-red-500"
          loading={statsLoading}
        />
        <StatCard
          title="Pending Join Requests"
          value={stats?.pendingJoinRequests}
          icon={UserPlus}
          colorClass="text-yellow-500"
          loading={statsLoading}
        />
        <StatCard
          title="Total Programmes"
          value={stats?.totalPrograms}
          icon={FileChartColumn}
          colorClass="text-cyan-500"
          loading={statsLoading}
        />
      </div>

      {/* ── Charts ── */}
      <ChartsDashboard />

      {/* ── Activity feed + Pending approvals ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed
              events={activityQ.data}
              loading={activityQ.isLoading}
            />
            {activityQ.isError && (
              <p className="text-sm text-destructive">Failed to load activity.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Approvals
              {pendingTotal > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingTotal}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendingApprovals
              data={pendingQ.data}
              loading={pendingQ.isLoading}
            />
            {pendingQ.isError && (
              <p className="text-sm text-destructive">Failed to load approvals.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top readers + Popular books ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-yellow-400" />
              Top Programmes
            </CardTitle>
            <CardDescription>Most enrolled programmes</CardDescription>
          </CardHeader>
          <CardContent>
            <TopProgramsList
              programs={topProgramsQ.data}
              loading={topProgramsQ.isLoading}
            />
            {topProgramsQ.isError && (
              <p className="text-sm text-destructive">Failed to load top programmes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Popular Books
            </CardTitle>
            <CardDescription>Most frequently issued books</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularBooksList
              books={popularBooksQ.data}
              loading={popularBooksQ.isLoading}
            />
            {popularBooksQ.isError && (
              <p className="text-sm text-destructive">Failed to load popular books.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Active Challenges + Recent Achievements ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* <ActiveChallengesWidget />
        <RecentAchievementsWidget /> */}
      </div>
    </div>
  );
}

export default RoleAwareDashboardHome;
