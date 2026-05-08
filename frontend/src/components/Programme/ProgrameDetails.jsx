import React from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import api from "@/app/api/apislice";
import { cn } from "@/lib/utils";
import Loader from "@/components/Loader";

const Card = ({ children, className = "" }) => (
  <div className={cn("rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-gray-700 dark:bg-gray-800/80", className)}>
    {children}
  </div>
);

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-700/40 dark:text-gray-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  draft: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

const StatCard = ({ icon, label, value, sub, color = "text-orange-500" }) => (
  <Card className="p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-gray-900", color)}>
        {React.createElement(icon, { size: 19 })}
      </div>
      <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</span>
    </div>
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
  </Card>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-gray-100">{value || "N/A"}</p>
  </div>
);

const getAttendanceSummary = (history = []) => {
  const totals = history.reduce(
    (acc, day) => {
      const records = Array.isArray(day.records) ? day.records : [];
      acc.sessions += 1;
      records.forEach((record) => {
        acc.total += 1;
        acc[record.status] = (acc[record.status] || 0) + 1;
      });
      return acc;
    },
    { sessions: 0, total: 0, present: 0, late: 0, absent: 0, excused: 0 }
  );

  const attended = totals.present + totals.late;
  return {
    ...totals,
    attendanceRate: totals.total ? (attended / totals.total) * 100 : 0,
  };
};

export default function ProgrameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const programQuery = useQuery({
    queryKey: ["program-detail", id],
    queryFn: async () => {
      const res = await api.get(`/programs/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(id && token),
    staleTime: 30_000,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["program-enrollments", id],
    queryFn: async () => {
      const res = await api.get(`/programs/${id}/enrollments`, { params: { page: 1, limit: 200 } });
      return res.data?.data || [];
    },
    enabled: Boolean(id && token),
    retry: false,
  });

  const attendanceQuery = useQuery({
    queryKey: ["program-attendance-history", id],
    queryFn: async () => {
      const res = await api.get(`/attendance/programs/${id}/history`);
      return res.data?.data || [];
    },
    enabled: Boolean(id),
    retry: false,
  });

  if (programQuery.isLoading) return <Loader />;

  if (programQuery.isError || !programQuery.data) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        {programQuery.error?.response?.data?.message || "Failed to load program details."}
      </div>
    );
  }

  const program = programQuery.data;
  const enrollments = enrollmentsQuery.data || [];
  const attendanceHistory = attendanceQuery.data || [];
  const attendance = getAttendanceSummary(attendanceHistory);
  const confirmedCount = program.confirmedCount ?? enrollments.filter((item) => item.status === "confirmed").length;
  const waitlistedCount = program.waitlistedCount ?? enrollments.filter((item) => item.status === "waitlisted").length;
  const pendingCount = enrollments.filter((item) => item.status === "pending").length;
  const capacity = Number(program.capacity || 0);
  const filledPercent = capacity ? (Number(confirmedCount || 0) / capacity) * 100 : 0;
  const teacherName = program.teacher?.fullName || program.teacherName || program.teacherId;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-slate-100 dark:hover:border-gray-600 dark:hover:bg-gray-700/60"
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-gray-200" />
          </button>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Program Details</p>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", STATUS_STYLES[program.status] || STATUS_STYLES.active)}>
                {program.status || "active"}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{program.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              {program.description || "No description was provided for this program."}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Confirmed Students" value={confirmedCount} sub={`${program.availableSeats ?? Math.max(capacity - confirmedCount, 0)} seats available`} color="text-emerald-500" />
        <StatCard icon={ClipboardList} label="Total Enrollment" value={program.enrollmentCount ?? confirmedCount + waitlistedCount} sub={`${pendingCount} pending, ${waitlistedCount} waitlisted`} color="text-orange-500" />
        <StatCard icon={Calendar} label="Attendance Sessions" value={attendance.sessions} sub={attendanceQuery.isError ? "No attendance access" : `${formatPercent(attendance.attendanceRate)} attendance rate`} color="text-blue-500" />
        <StatCard icon={TrendingUp} label="Capacity Filled" value={formatPercent(filledPercent)} sub={`${confirmedCount} of ${capacity || "N/A"} seats`} color="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <BookOpen size={20} className="text-orange-500" /> Program Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem label="Program ID" value={program._id} />
              <InfoItem label="Capacity" value={program.capacity} />
              <InfoItem label="Start Date" value={formatDate(program.startDate)} />
              <InfoItem label="End Date" value={formatDate(program.endDate)} />
              <InfoItem label="Created" value={formatDate(program.createdAt)} />
              <InfoItem label="Updated" value={formatDate(program.updatedAt)} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Users size={20} className="text-orange-500" /> Enrolled Students
            </h2>
            {enrollmentsQuery.isError ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">You do not have permission to view the enrollment list.</p>
            ) : enrollmentsQuery.isLoading ? (
              <p className="text-sm text-slate-400">Loading enrollments...</p>
            ) : enrollments.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-gray-900">
                    <tr>
                      <th className="p-3 text-left">Student</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {enrollments.slice(0, 8).map((item) => {
                      const user = typeof item.userId === "object" ? item.userId : null;
                      const formData = item.formData || {};
                      const name = [user?.first_name || formData.firstName, user?.last_name || formData.lastName].filter(Boolean).join(" ") || "Unknown learner";
                      const email = user?.email || formData.email || "";

                      return (
                        <tr key={item._id} className="dark:text-gray-100">
                          <td className="p-3 font-semibold">{name}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{email || "N/A"}</td>
                          <td className="p-3 capitalize">{item.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No students are enrolled in this program yet.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <GraduationCap size={20} className="text-orange-500" /> Assigned Teacher
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
                {String(teacherName || "T").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-white">{teacherName || "Teacher N/A"}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{program.teacher?.email || program.teacherId}</p>
              </div>
            </div>
            {Array.isArray(program.assistants) && program.assistants.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Assistants</p>
                <div className="flex flex-wrap gap-2">
                  {program.assistants.map((assistant) => (
                    <span key={assistant} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-gray-900 dark:text-slate-300">
                      {assistant}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <UserCheck size={20} className="text-orange-500" /> Attendance Summary
            </h2>
            {attendanceQuery.isError ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Attendance information is only visible to users with attendance access.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <InfoItem label="Sessions Marked" value={attendance.sessions} />
                <InfoItem label="Present" value={attendance.present} />
                <InfoItem label="Late" value={attendance.late} />
                <InfoItem label="Absent" value={attendance.absent} />
                <InfoItem label="Excused" value={attendance.excused} />
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Clock size={20} className="text-orange-500" /> Recent Attendance
            </h2>
            {attendanceHistory.length ? (
              <div className="space-y-3">
                {attendanceHistory.slice(0, 5).map((day) => (
                  <div key={day._id} className="rounded-xl border border-slate-100 p-3 dark:border-gray-700">
                    <p className="font-semibold text-slate-900 dark:text-white">{formatDate(day.date)}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{Array.isArray(day.records) ? day.records.length : 0} records marked</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No attendance history yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
