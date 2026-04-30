import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  GraduationCap,
  Mail,
  Phone,
  Sparkles,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import { Button } from "@/components/ui/button";
import Heros from "../Homepage/HeroSections";

const ORANGE = {
  accent: "#f97316",
  accentLight: "#fff7ed",
  accentMid: "#fed7aa",
};

const FILTERS = [
  { key: "all", label: "All programs" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "completed", label: "Completed" },
  { key: "inactive", label: "Inactive" },
];

const BADGE_STYLES = {
  active: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Open" },
  draft: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d", label: "Draft" },
  completed: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd", label: "Completed" },
  inactive: { bg: "#e2e8f0", color: "#475569", border: "#cbd5e1", label: "Inactive" },
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200";

const Label = ({ children, required }) => (
  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
    {children}
    {required && <span className="ml-0.5 text-orange-500">*</span>}
  </label>
);

const formatDate = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDurationLabel = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Schedule TBD";

  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;

  const weeks = Math.ceil(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
};

const getProgramVisual = (program) => {
  const enrollmentCount = Number(program.enrollmentCount || 0);
  const availableSeats =
    typeof program.availableSeats === "number"
      ? program.availableSeats
      : Math.max(Number(program.capacity || 0) - Number(program.confirmedCount || 0), 0);
  const isFull = availableSeats <= 0;
  const badgeKey = isFull && program.status === "active" ? "inactive" : program.status || "active";

  return {
    ...program,
    ...ORANGE,
    icon: BookOpen,
    badgeKey,
    badgeLabel: isFull && program.status === "active" ? "Full" : (BADGE_STYLES[badgeKey]?.label || "Open"),
    teacher: program.teacherId || "Assigned teacher",
    duration: getDurationLabel(program.startDate, program.endDate),
    schedule: `${formatDate(program.startDate)} - ${formatDate(program.endDate)}`,
    enrolled: enrollmentCount,
    availableSeats,
    isFull,
    statusLabel: program.status || "active",
    outcomes: [
      `Learn through ${program.title || "this program"}`,
      `Join ${enrollmentCount} enrolled learner${enrollmentCount === 1 ? "" : "s"}`,
      `${availableSeats} seat${availableSeats === 1 ? "" : "s"} still available`,
    ],
  };
};

const fetchPrograms = async () => {
  const response = await api.get("/programs", { params: { page: 1, limit: 200 } });
  return response.data?.data ?? [];
};

const CapacityBar = ({ enrolled, capacity }) => {
  const safeCapacity = Math.max(Number(capacity) || 0, 1);
  const pct = Math.min(100, Math.round((Number(enrolled || 0) / safeCapacity) * 100));
  const barColor = pct >= 90 ? "#ef4444" : "#f97316";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Users size={10} />
          {enrolled} / {capacity} seats
        </span>
        <span className="font-semibold" style={{ color: barColor }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
};

const ProgramCard = ({ program, onEnroll }) => {
  const badgeStyle = BADGE_STYLES[program.badgeKey] || BADGE_STYLES.active;
  const isLocked = program.status !== "active" || program.isFull;

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-[110px] overflow-hidden" style={{ background: program.accentLight }}>
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-[0.15]" style={{ background: program.accent }} />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-[0.08]" style={{ background: program.accent }} />
        <div className="absolute bottom-4 left-5 right-5 z-10 flex items-end justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] shadow-md" style={{ background: program.accent }}>
            <program.icon size={22} className="text-white" />
          </div>
          <span
            className="rounded-full border px-3 py-1 text-[11px] font-bold"
            style={{ background: badgeStyle.bg, color: badgeStyle.color, borderColor: badgeStyle.border }}
          >
            {program.badgeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
        <div>
          <h3 className="mb-1.5 text-[15px] font-bold leading-tight text-slate-900">{program.title}</h3>
          <p className="line-clamp-3 text-[12.5px] leading-relaxed text-slate-500">
            {program.description || "Program description will be shared by the organizer."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
          <span className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-orange-600">
            {program.statusLabel}
          </span>
          <span className="rounded-full border border-slate-200 px-2.5 py-1">{program.duration}</span>
        </div>

        <div className="space-y-2 text-[12px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <GraduationCap size={11} />
            {program.teacher}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarRange size={11} />
            {program.schedule}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            {program.duration}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Star size={11} className="fill-orange-400 text-orange-400" />
          <span className="text-[12px] font-bold text-slate-700">Free program</span>
        </div>

        <CapacityBar enrolled={program.enrolled} capacity={program.capacity} />

        <div className="space-y-2 rounded-2xl bg-orange-50/70 p-4">
          {program.outcomes.map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[12px] text-slate-600">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <CheckCircle2 size={12} className="text-orange-500" />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onEnroll(program)}
          disabled={isLocked}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-extrabold text-white transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          style={{ background: isLocked ? undefined : program.accent }}
        >
          {program.status !== "active"
            ? `Program ${program.status}`
            : program.isFull
              ? "Program full"
              : "Enroll for free"}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const SuccessScreen = ({ program, onClose }) => (
  <div className="flex flex-col items-center px-8 py-10 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
      <Check size={28} className="text-emerald-600" />
    </div>
    <h3 className="mb-2 text-[22px] font-extrabold text-slate-900">Enrollment submitted</h3>
    <p className="max-w-md text-sm leading-7 text-slate-500">
      You have successfully enrolled in <span className="font-semibold text-slate-700">{program.title}</span>.
    </p>
    <Button onClick={onClose} className="mt-6 rounded-xl bg-orange-500 px-6 text-white hover:bg-orange-600">
      Close
    </Button>
  </div>
);

const EnrollDialog = ({ program, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth || {});
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
    email: user?.email || "",
    phone: user?.phone || "",
    goals: "",
  });

  const enrollMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(`/programs/${program._id}/enroll`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      setDone(true);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to enroll in this program");
    },
  });

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    if (!token || !user?._id) {
      toast.error("Please log in before enrolling.");
      navigate("/login");
      return;
    }

    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    enrollMutation.mutate({
      userId: user._id,
      formData: {
        ...form,
        programTitle: program.title,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {done ? (
          <SuccessScreen program={program} onClose={onClose} />
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-slate-100 px-7 pb-5 pt-7">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Enrolling in</p>
                <h3 className="mt-1 text-[18px] font-extrabold text-slate-900">{program.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{program.schedule}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-5 px-7 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label required>Full name</Label>
                  <input
                    className={inputCls}
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label required>Email address</Label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputCls} pl-9`}
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Phone number</Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputCls} pl-9`}
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="+251..."
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Learning goals</Label>
                  <textarea
                    rows={4}
                    className={`${inputCls} resize-none`}
                    value={form.goals}
                    onChange={(event) => updateField("goals", event.target.value)}
                    placeholder="Tell us what you want to achieve in this program."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-orange-700">
                  <Target size={15} />
                  This program is free
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Once you submit, your enrollment will be saved in the real enrollments table for this project.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-7 py-5">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-5">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={enrollMutation.isPending}
                className="rounded-xl bg-orange-500 px-5 text-white hover:bg-orange-600"
              >
                {enrollMutation.isPending ? "Submitting..." : "Complete enrollment"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2.5">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-100 bg-orange-50">
      <Icon size={15} className="text-orange-500" />
    </div>
    <div>
      <p className="text-[15px] font-extrabold leading-none text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
    </div>
  </div>
);

const ProgramsPage = () => {
  const [active, setActive] = useState("all");
  const [enrollTarget, setEnrollTarget] = useState(null);

  const { data: rawPrograms = [], isLoading, isError } = useQuery({
    queryKey: ["public-programs"],
    queryFn: fetchPrograms,
    staleTime: 30_000,
  });

  const programs = useMemo(() => rawPrograms.map(getProgramVisual), [rawPrograms]);

  const visible = useMemo(() => {
    if (active === "all") return programs;
    return programs.filter((program) => program.status === active);
  }, [active, programs]);

  const totalEnrollments = useMemo(
    () => programs.reduce((sum, program) => sum + Number(program.enrolled || 0), 0),
    [programs]
  );

  return (
    <div className="min-h-screen bg-white px-4 pb-20 pt-16">
      <Heros />

      <div className="mx-auto mt-25 max-w-6xl">
        <div className="mb-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-[12px] font-bold text-orange-500">
            <Sparkles size={12} /> Real programs · Real enrollments · Free access
          </div>

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-[52px]">
                Build skills that <span className="text-orange-500">open doors</span>
              </h1>
              <p className="mt-5 max-w-lg text-[16px] leading-[1.75] text-slate-500">
                Browse live programs from the database, see current capacity, and enroll directly into the real enrollment records.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 lg:pb-1">
              <Stat icon={Users} value={String(totalEnrollments)} label="Saved enrollments" />
              <Stat icon={Star} value="Free" label="Every program" />
              <Stat icon={Globe} value={String(programs.length)} label="Programs live" />
            </div>
          </div>

          <div className="mt-10 h-px bg-gradient-to-r from-orange-200 via-slate-100 to-transparent" />
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={`rounded-xl px-4 py-2 text-[13px] font-bold transition-all duration-200 ${
                  active === key
                    ? "scale-[1.02] bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-[13px] font-medium text-slate-400">
            {visible.length} program{visible.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading && <div className="py-20 text-center text-sm text-slate-400">Loading programs...</div>}

        {isError && <div className="py-20 text-center text-sm text-red-500">Failed to load programs.</div>}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((program) => (
              <ProgramCard key={program._id} program={program} onEnroll={setEnrollTarget} />
            ))}
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="py-24 text-center">
            <Globe size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-400">No programs in this group yet.</p>
          </div>
        )}

        <div className="mt-16 flex flex-col items-center justify-between gap-5 rounded-3xl border border-orange-100 bg-orange-50 px-8 py-7 sm:flex-row">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-900">Every program is free now</h3>
            <p className="mt-1 text-[13px] text-slate-500">Create programs without price fields and let learners enroll directly.</p>
          </div>
          <Button className="gap-2 rounded-xl bg-orange-500 px-6 font-bold text-white shadow-md shadow-orange-200 hover:bg-orange-600">
            Explore programs <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {enrollTarget && <EnrollDialog program={enrollTarget} onClose={() => setEnrollTarget(null)} />}
    </div>
  );
};

export default ProgramsPage;
