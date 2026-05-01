import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, XCircle, Clock, Search, X, Save,
  Users, Calendar, BarChart3, BookOpen, ArrowRight,
  AlertCircle, Zap, ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/api/apislice";

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .map((part) => part?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* 
   CONSTANTS
 */
const STATUS = {
  present: { label: "Present", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40", dot: "bg-emerald-500", bar: "bg-emerald-400" },
  absent:  { label: "Absent",  icon: XCircle,      color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20",         border: "border-red-200 dark:border-red-800/40",         dot: "bg-red-500",     bar: "bg-red-400"     },
  late:    { label: "Late",    icon: Clock,         color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20",     border: "border-amber-200 dark:border-amber-800/40",     dot: "bg-amber-500",   bar: "bg-amber-400"   },
  excused: { label: "Excused", icon: AlertCircle,   color: "text-slate-500 dark:text-slate-400",     bg: "bg-slate-100 dark:bg-slate-800/40",    border: "border-slate-200 dark:border-slate-700",        dot: "bg-slate-400",   bar: "bg-slate-300"   },
};

const today    = new Date().toISOString().slice(0, 10);
const fmtDate  = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtShort = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });

/* 
   STATUS TOGGLE — cycles through statuses on click
 */
const StatusToggle = ({ value, onChange }) => {
  const keys = Object.keys(STATUS);
  const meta = STATUS[value] || STATUS.absent;
  const Icon = meta.icon;
  const cycle = () => onChange(keys[(keys.indexOf(value) + 1) % keys.length]);
  return (
    <button type="button" onClick={cycle}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-bold transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] select-none ${meta.bg} ${meta.border} ${meta.color}`}>
      <Icon size={13} strokeWidth={2.5} />
      {meta.label}
    </button>
  );
};

/* 
   PROGRAM SIDEBAR CARD
 */
const ProgramCard = ({ program, selected, onClick, rate }) => (
  <button onClick={onClick}
    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group
      ${selected
        ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-md shadow-orange-100 dark:shadow-orange-900/20"
        : "border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-orange-200 hover:shadow-sm"
      }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all
        ${selected ? "bg-orange-500 shadow-sm shadow-orange-200" : "bg-orange-50 dark:bg-orange-900/20"}`}>
        <BookOpen size={15} className={selected ? "text-white" : "text-orange-500"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-extrabold leading-tight truncate ${selected ? "text-orange-700 dark:text-orange-300" : "text-slate-900 dark:text-white"}`}>
          {program.title}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
          <Users size={9} /> {program.capacity ? `${program.capacity} capacity` : "Capacity —"}
        </p>
      </div>
      {rate !== null && (
        <span className={`text-[12px] font-extrabold shrink-0 ${rate >= 80 ? "text-emerald-500" : rate >= 60 ? "text-amber-500" : "text-red-500"}`}>
          {rate}%
        </span>
      )}
    </div>
  </button>
);

/* 
   MAIN PAGE
 */
export default function AttendancePage() {
  const qc = useQueryClient();
  const [selected,  setSelected]  = useState(null);
  const [date,      setDate]      = useState(today);
  const [search,    setSearch]    = useState("");
  const [records,   setRecords]   = useState({});
  const [view,      setView]      = useState("mark");

  const programsQuery = useQuery({
    queryKey: ["attendance-programs"],
    queryFn: async () => {
      const res = await api.get("/attendance/programs");
      return res.data?.data || [];
    },
    staleTime: 30_000,
  });

  const programs = programsQuery.data || [];

  const detailQuery = useQuery({
    queryKey: ["attendance-program-detail", { programId: selected, date }],
    enabled: Boolean(selected && date),
    queryFn: async () => {
      const res = await api.get(`/attendance/programs/${selected}`, { params: { date } });
      return res.data?.data || null;
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const prog = detailQuery.data?.program || programs.find((p) => String(p._id) === String(selected));
  const students = detailQuery.data?.students || [];
  const attendance = detailQuery.data?.attendance || null;

  useEffect(() => {
    if (!selected || !date) return;

    const serverRecords = Array.isArray(attendance?.records) ? attendance.records : [];
    const byStudentId = {};
    serverRecords.forEach((r) => {
      if (!r?.studentId) return;
      byStudentId[String(r.studentId)] = r.status || "absent";
    });

    setRecords((prev) => {
      const next = { ...prev };
      next[selected] = { ...(next[selected] || {}) };
      next[selected][date] = { ...byStudentId };
      return next;
    });
  }, [attendance, selected, date]);

  /* helpers */
  const getStatus = (sid) => records?.[selected]?.[date]?.[sid] || "absent";
  const setStatus = (sid, val) =>
    setRecords((p) => ({
      ...p,
      [selected]: {
        ...(p[selected] || {}),
        [date]: { ...(p[selected]?.[date] || {}), [sid]: val },
      },
    }));

  const markAll = (val) => {
    const u = {};
    students.forEach((s) => {
      const sid = String(s.studentId || s.id);
      u[sid] = val;
    });
    setRecords((p) => ({
      ...p,
      [selected]: {
        ...(p[selected] || {}),
        [date]: { ...(p[selected]?.[date] || {}), ...u },
      },
    }));
  };

  /* summary */
  const summary = useMemo(() => {
    if (!selected) return null;
    const rec = records?.[selected]?.[date] || {};
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    students.forEach((s) => {
      const sid = String(s.studentId || s.id);
      c[rec[sid] || "absent"]++;
    });
    return { ...c, total: students.length };
  }, [records, selected, date, students]);

  const progRate = () => null;

  /* filtered */
  const filtered = useMemo(() =>
    students.filter((s) => {
      if (!search) return true;
      const needle = search.toLowerCase();
      return (
        String(s.name || "").toLowerCase().includes(needle) ||
        String(s.email || "").toLowerCase().includes(needle)
      );
    }),
    [students, search]
  );

  const historyQuery = useQuery({
    queryKey: ["attendance-history", { programId: selected }],
    enabled: Boolean(selected),
    queryFn: async () => {
      const res = await api.get(`/attendance/programs/${selected}/history`);
      return res.data?.data || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const history = historyQuery.data || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const perStudent = records?.[selected]?.[date] || {};
      const payloadRecords = students.map((s) => {
        const sid = String(s.studentId || s.id);
        return {
          studentId: sid,
          status: perStudent[sid] || "absent",
          name: s.name || "",
          email: s.email || "",
        };
      });
      const res = await api.post(`/attendance/programs/${selected}`, {
        date,
        records: payloadRecords,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success(`Attendance saved — ${fmtShort(date)}`);
      qc.invalidateQueries({ queryKey: ["attendance-program-detail"] });
      qc.invalidateQueries({ queryKey: ["attendance-history"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to save attendance");
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-20">

      {/* ── Header  */}
      <div className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 px-6 py-7">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-500 text-[11px] font-extrabold uppercase tracking-widest mb-4">
                <Zap size={11} className="fill-orange-400" />
                Attendance tracking
              </div>
              <h1 className="text-[32px] font-extrabold text-slate-900 dark:text-white tracking-tight">Programme Attendance</h1>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
                Each programme has its own independent attendance record. Select a programme to get started.
              </p>
            </div>
            <div className="flex gap-5 shrink-0">
              {[
                { icon: BookOpen, value: programs.length,                           label: "Programmes"     },
                { icon: Users,    value: "—", label: "Total students" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center">
                    <Icon size={14} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body  */}
      <div className="max-w-8xl  px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">

          {/* Sidebar */}
          <aside>
            <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Programmes</p>
            <div className="flex flex-col gap-3">
              {programs.map(p => (
                <ProgramCard key={p._id} program={p} selected={String(selected) === String(p._id)} rate={progRate(p._id)}
                  onClick={() => { setSelected(String(p._id)); setView("mark"); setSearch(""); }} />
              ))}
            </div>
          </aside>

          {/* Main panel */}
          <main>
            {!selected ? (
              <div className="flex flex-col items-center justify-center py-28 bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 text-center">
                <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center mb-5">
                  <BookOpen size={30} className="text-orange-300" />
                </div>
                <h3 className="text-[17px] font-extrabold text-slate-800 dark:text-white mb-2">No programme selected</h3>
                <p className="text-[13px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                  Choose a programme from the list to start marking or reviewing attendance.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">

                {/* Panel header */}
                <div className="bg-white  dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-orange-500 mb-0.5">Programme</p>
                    <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{prog?.title}</h2>
                    <p className="text-[11.5px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Calendar size={10} /> {fmtDate(prog?.startDate)} → {fmtDate(prog?.endDate)}
                      <span className="mx-1">·</span>
                      <Users size={10} /> {students.length} students
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Date */}
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="pl-9 pr-3 h-10 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-[12.5px] text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all" />
                    </div>
                    {/* View toggle */}
                    <div className="flex rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                      {[{ k: "mark", l: "Mark" }, { k: "history", l: "History" }].map(({ k, l }) => (
                        <button key={k} onClick={() => setView(k)}
                          className={`px-4 py-2 text-[12px] font-bold transition-all ${view === k ? "bg-orange-500 text-white" : "bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:bg-orange-50 hover:text-orange-500"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {view === "mark" && <>
                  {/* Summary stats */}
                  {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(STATUS).map(([key, meta]) => {
                        const Icon = meta.icon;
                        const count = summary[key] || 0;
                        const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                        return (
                          <div key={key} className={`flex items-center gap-3 p-4 rounded-2xl border ${meta.bg} ${meta.border}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                              <Icon size={18} className={meta.color} strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className={`text-[24px] font-extrabold leading-none ${meta.color}`}>{count}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{meta.label} · {pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full pl-9 pr-9 h-10 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[13px] text-slate-800 dark:text-gray-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                        placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)}
                      />
                      {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mr-1">Mark all:</span>
                      {Object.entries(STATUS).map(([k, m]) => (
                        <button key={k} onClick={() => markAll(k)}
                          className={`text-[11.5px] font-bold px-3 py-1.5 rounded-xl border transition-all hover:scale-[1.03] ${m.bg} ${m.border} ${m.color}`}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Student list */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    {/* Table head */}
                    <div className="grid grid-cols-[1fr_auto] bg-slate-50 dark:bg-gray-800/60 border-b border-slate-100 dark:border-gray-800 px-5 py-3">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Student</span>
                      <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</span>
                    </div>
                    {filtered.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-slate-400">No students match your search.</div>
                    ) : filtered.map((s, i) => {
                      const sid = String(s.studentId || s.id);
                      return (
                      <div key={sid}
                        className={`grid grid-cols-[1fr_auto] items-center px-5 py-3.5 border-b border-slate-50 dark:border-gray-800/60 last:border-0 ${i % 2 !== 0 ? "bg-slate-50/40 dark:bg-gray-800/20" : ""}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-[11px] font-extrabold text-white shadow-sm shrink-0">
                            {getInitials(s.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                            <p className="text-[11.5px] text-slate-400 dark:text-slate-500 truncate">{s.email}</p>
                          </div>
                        </div>
                        <StatusToggle value={getStatus(sid)} onChange={v => setStatus(sid, v)} />
                      </div>
                    );})}
                  </div>

                  {/* Save bar */}
                  <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 px-6 py-4 shadow-sm">
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">
                      Session: <span className="font-extrabold text-slate-800 dark:text-white">{fmtShort(date)}</span>
                      <span className="mx-2 text-slate-300">·</span>
                      {summary && <>
                        <span className="text-emerald-600 font-bold">{summary.present} present</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="font-semibold">{students.length} total</span>
                      </>}
                    </div>
                    <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-extrabold shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                      {saveMutation.isPending
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                        : <><Save size={14} />Save attendance</>}
                    </button>
                  </div>
                </>}

                {view === "history" && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <BarChart3 size={14} className="text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white">Attendance history</h3>
                        <p className="text-[11px] text-slate-400">All recorded sessions for this programme</p>
                      </div>
                    </div>
                    {history.length === 0 ? (
                      <div className="py-16 text-center">
                        <AlertCircle size={28} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-[13px] text-slate-400">No attendance records yet for this programme.</p>
                      </div>
                    ) : history.map((h) => {
                      const d = String(h.date);
                      const recs = Array.isArray(h.records) ? h.records : [];
                      const c = { present: 0, absent: 0, late: 0, excused: 0 };
                      recs.forEach((r) => {
                        const st = r?.status;
                        if (st && c[st] !== undefined) c[st] += 1;
                        else c.absent += 1;
                      });
                      const total = recs.length;
                      const rate = Math.round((c.present / Math.max(total, 1)) * 100);
                      return (
                        <div key={d} onClick={() => { setDate(d); setView("mark"); }}
                          className="px-6 py-4 flex items-center gap-5 border-b border-slate-50 dark:border-gray-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-gray-800/30 cursor-pointer group transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center shrink-0">
                            <Calendar size={14} className="text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-bold text-slate-900 dark:text-white">{fmtShort(d)}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-[11.5px]">
                              <span className="text-emerald-500 font-semibold">{c.present} present</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-red-400 font-semibold">{c.absent} absent</span>
                              {c.late > 0 && <><span className="text-slate-300">·</span><span className="text-amber-500 font-semibold">{c.late} late</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${rate}%` }} />
                            </div>
                            <span className={`text-[13px] font-extrabold w-9 text-right ${rate >= 80 ? "text-emerald-500" : rate >= 60 ? "text-amber-500" : "text-red-500"}`}>{rate}%</span>
                            <ChevronRightIcon size={14} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}