import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import HeroHeader from '../Homepage/HeroSections';
import Footer from "../Homepage/Footer";

import {
  Clock, Users, Star, BookOpen, ChevronRight, ChevronLeft,
  Sparkles, TrendingUp, Globe, Flame, X,
  GraduationCap, BarChart3, Palette, Shield, Bot,
  ArrowRight, CheckCircle2, User, Phone, Mail, BookMarked,
  Check,
} from "lucide-react";

/* 
   DATA
 */
/* single brand palette — every card uses these */
const OR = { accent: "#f97316", accentLight: "#fff7ed", accentMid: "#fed7aa" };

const FILTERS = [
  { key: "all", label: "All programs" },
  { key: "tech", label: "Technology" },
  { key: "business", label: "Business" },
  { key: "design", label: "Design" },
  { key: "data", label: "Data & AI" },
];

const BADGE_STYLES = {
  featured: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  new: { bg: "#fff7ed", color: "#ea580c", border: "#fdba74" },
  active: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  soon: { bg: "#fff3e8", color: "#9a3412", border: "#fed7aa" },
  full: { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
};

/* 
   ENROLLMENT DIALOG — 4 steps
 */

const STEPS = [
  { id: 1, label: "Registration", icon: User },
  { id: 2, label: "Education", icon: BookMarked },
];

const EDUCATION_LEVELS = [
  "High school diploma",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Professional certification",
  "Self-taught / No formal degree",
];

/* small helpers */
const inputCls =
  "w-full px-4 py-3 rounded-xl text-[13px] bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 " +
  "text-slate-800 dark:text-gray-100 placeholder:text-slate-300 dark:placeholder:text-gray-500 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all";

const Label = ({ children, req }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}{req && <span className="text-orange-400 ml-0.5">*</span>}
  </label>
);

const FieldWrap = ({ children, className = "" }) => (
  <div className={`flex flex-col ${className}`}>{children}</div>
);

const formatDate = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const deriveDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Schedule TBD";
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  if (days < 7) return `${days} days`;
  const weeks = Math.ceil(days / 7);
  return `${weeks} weeks`;
};

const getTeacherInitials = (teacher = "") =>
  String(teacher)
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PR";

const deriveCategory = (program) => {
  const haystack = `${program.title || ""} ${program.description || ""}`.toLowerCase();
  if (/design|ui|ux|figma|creative/.test(haystack)) return "design";
  if (/data|ai|machine learning|python|analytics|science/.test(haystack)) return "data";
  if (/business|marketing|growth|seo|sales/.test(haystack)) return "business";
  return "tech";
};

const deriveIcon = (category, title = "") => {
  const lowered = title.toLowerCase();
  if (/security|cyber/.test(lowered)) return Shield;
  if (/ai|prompt|bot/.test(lowered)) return Bot;
  if (category === "data") return BarChart3;
  if (category === "design") return Palette;
  if (category === "business") return TrendingUp;
  return BookOpen;
};

const deriveTags = (program, category) => {
  const text = `${program.title || ""} ${program.description || ""}`;
  const tokens = text
    .split(/[^A-Za-z0-9+#.]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3);
  const unique = [...new Set(tokens)].slice(0, 3);
  if (unique.length) return unique;

  if (category === "data") return ["Python", "Analytics", "Projects"];
  if (category === "design") return ["Design", "Research", "Systems"];
  if (category === "business") return ["Growth", "Marketing", "Strategy"];
  return ["React", "Node.js", "Projects"];
};

const deriveBadge = (program, isFull) => {
  if (isFull) return { badge: "full", badgeLabel: "Full" };
  if (program.status === "draft") return { badge: "soon", badgeLabel: "Starting soon" };
  if (program.status === "completed") return { badge: "active", badgeLabel: "Completed" };
  if ((program.enrollmentCount || 0) > 0) return { badge: "featured", badgeLabel: "Featured" };
  return { badge: "new", badgeLabel: "New" };
};

const deriveOutcomes = (program, availableSeats) => [
  `Join the ${program.title} cohort`,
  `${program.enrollmentCount || 0} learners already enrolled`,
  `${availableSeats} seats currently available`,
];

const mapProgramToCard = (program) => {
  const category = deriveCategory(program);
  const icon = deriveIcon(category, program.title);
  const enrolled = Number(program.confirmedCount ?? program.enrollmentCount ?? 0);
  const capacity = Number(program.capacity || 0);
  const availableSeats = typeof program.availableSeats === "number"
    ? program.availableSeats
    : Math.max(capacity - enrolled, 0);
  const isFull = availableSeats <= 0 || program.status === "inactive";
  const badgeMeta = deriveBadge(program, isFull);

  return {
    id: program._id,
    _id: program._id,
    createdAt: program.createdAt,
    startDate: program.startDate,
    endDate: program.endDate,
    category,
    icon,
    ...OR,
    badge: badgeMeta.badge,
    badgeLabel: badgeMeta.badgeLabel,
    title: program.title,
    desc: program.description || "Program details will be shared during enrollment.",
    teacher: program.teacher.fullName || "Program instructor",

    teacherInitials: getTeacherInitials(program.teacherId || "Program instructor"),
    duration: deriveDuration(program.startDate, program.endDate),
    enrolled,
    capacity,
    rating: 4.8,
    reviews: Math.max(12, Number(program.enrollmentCount || 0) * 3 || 12),
    price: 0,
    free: true,
    status: isFull ? "full" : "open",
    tags: deriveTags(program, category),
    outcomes: deriveOutcomes(program, availableSeats),
  };
};

const fetchPrograms = async () => {
  const res = await api.get("/programs", { params: { page: 1, limit: 200 }, skipAuth: true });
  const raw = res.data?.data || [];
  const sorted = [...raw].sort((a, b) => {
    const aTime = new Date(a?.createdAt || a?.startDate || 0).getTime() || 0;
    const bTime = new Date(b?.createdAt || b?.startDate || 0).getTime() || 0;
    return bTime - aTime;
  });
  return sorted.map(mapProgramToCard);
};

/* Step 1 — Personal information */
const StepPersonal = ({ data, onChange, requireFullForm = false }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FieldWrap>
      <Label req>First name</Label>
      <input className={inputCls} placeholder="John" value={data.firstName} onChange={e => onChange("firstName", e.target.value)} />
    </FieldWrap>
    <FieldWrap>
      <Label req>Last name</Label>
      <input className={inputCls} placeholder="Doe" value={data.lastName} onChange={e => onChange("lastName", e.target.value)} />
    </FieldWrap>
    <FieldWrap className="sm:col-span-2">
      <Label req>Email address</Label>
      <div className="relative">
        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="john@example.com" type="email" value={data.email} onChange={e => onChange("email", e.target.value)} />
      </div>
    </FieldWrap>
    <FieldWrap>
      <Label req={requireFullForm}>Phone number</Label>
      <div className="relative">
        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="+1 555 000 0000" value={data.phone} onChange={e => onChange("phone", e.target.value)} />
      </div>
    </FieldWrap>
    {/* <FieldWrap>
      <Label>Date of birth</Label>
      <input className={inputCls} type="date" value={data.dob} onChange={e => onChange("dob", e.target.value)} />
    </FieldWrap> */}
    <FieldWrap>
      <Label req={requireFullForm}>Gender</Label>
      <div className="relative">
        <select className={`${inputCls} appearance-none`} value={data.gender} onChange={e => onChange("gender", e.target.value)}>
          <option value="">Select…</option>
          <option>Male</option>
          <option>Female</option>
        
        </select>
        <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
      </div>
    </FieldWrap>
  </div>
);

/* Step 2 — Education background */
const StepEducation = ({ data, onChange, requireFullForm = false }) => (
  <div className="flex flex-col gap-5">
    <FieldWrap>
      <Label req>Education background</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {EDUCATION_LEVELS.map((lvl) => {
          const active = data.educationLevel === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange("educationLevel", lvl)}
              className={`text-left px-4 py-3 rounded-xl border text-[13px] font-medium transition-all duration-150
                ${active
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-2 ring-orange-100 dark:ring-orange-900/30"
                  : "border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-orange-200 hover:bg-orange-50/50 dark:hover:bg-orange-900/10"
                }`}
            >
              <span className={`mr-2 inline-block w-3.5 h-3.5 rounded-full border-2 align-middle transition-colors ${active ? "border-orange-500 bg-orange-500" : "border-slate-300 dark:border-slate-500"}`} />
              {lvl}
            </button>
          );
        })}
      </div>
    </FieldWrap>

    <FieldWrap>
      <Label req={requireFullForm}>School / Institution</Label>
      <input
        className={inputCls}
        placeholder="Your school, college, or institution"
        value={data.institution}
        onChange={e => onChange("institution", e.target.value)}
      />
    </FieldWrap>

    <FieldWrap>
      <Label req={requireFullForm}>Field of study</Label>
      <input
        className={inputCls}
        placeholder="Computer science, business, design..."
        value={data.fieldOfStudy}
        onChange={e => onChange("fieldOfStudy", e.target.value)}
      />
    </FieldWrap>
  </div>
);

/*  Success screen  */
const SuccessScreen = ({ program, onClose, status }) => {
  const normalized = String(status || "").toLowerCase();
  const isPending = normalized === "pending";
  const isWaitlisted = normalized === "waitlisted";

  const title = isPending
    ? "Request submitted"
    : isWaitlisted
      ? "You're waitlisted"
      : "You're enrolled! 🎉";

  const message = isPending
    ? "Your enrollment request was sent. An admin will review it and you'll get an email when it's approved or rejected."
    : isWaitlisted
      ? "The program is currently full. You're on the waitlist and we'll notify you if a seat opens up."
      : "Check your email for confirmation and next steps.";

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-5">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
      style={{ background: program.accent }}
    >
      <Check size={36} className="text-white" strokeWidth={3} />
    </div>
    <div>
      <h3 className="text-[22px] font-extrabold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-[14px] text-slate-500 dark:text-slate-300 max-w-sm leading-relaxed">
        {isPending ? (
          <>
            For <span className="font-bold text-slate-800 dark:text-white">{program.title}</span>, {message}
          </>
        ) : (
          <>
            Welcome to <span className="font-bold text-slate-800 dark:text-white">{program.title}</span>. {message}
          </>
        )}
      </p>
    </div>
    <div
      className="w-full rounded-2xl p-4 flex items-center gap-3"
      style={{ background: program.accentLight }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: program.accent }}
      >
        <program.icon size={18} className="text-white" />
      </div>
      <div className="text-left">
        <p className="text-[13px] font-bold text-slate-800 dark:text-white">{program.title}</p>
        <p className="text-[12px] text-slate-500 dark:text-slate-300">{program.duration} · with {program.teacher}</p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-[16px] font-extrabold" style={{ color: program.accent }}>
          Free
        </p>
      </div>
    </div>
    <Button
      onClick={onClose}
      className="mt-2 rounded-xl px-8 font-bold text-white"
      style={{ background: program.accent }}
    >
      Back to programs
    </Button>
    </div>
  );
};

const ConfirmEnrollDialog = ({ program, onClose }) => {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/programs/${program._id}/enroll`, { formData: {} });
      return res.data;
    },
    onSuccess: (data) => {
      setEnrollStatus(data?.data?.status || null);
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      setDone(true);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to enroll");
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,20,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-250 bg-white dark:bg-gray-900"
      >
        {done ? (
          <SuccessScreen program={program} status={enrollStatus} onClose={onClose} />
        ) : (
          <>
            <div className="px-7 pt-7 pb-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm shrink-0"
                    style={{ background: program.accent }}
                  >
                    <program.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Confirm enrollment</p>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight">{program.title}</h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-[13.5px] text-slate-500 dark:text-slate-300 leading-relaxed">
                Do you want to enroll in this program?
              </p>
            </div>

            <div className="px-7 py-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-end gap-3 bg-slate-50/60 dark:bg-gray-900">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                disabled={enrollMutation.isPending}
              >
                No
              </button>
              <Button
                onClick={() => enrollMutation.mutate()}
                className="rounded-xl px-5 font-bold text-white"
                style={{ background: program.accent }}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? "Enrolling..." : "Yes, enroll"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/*  Enrollment Dialog  */
const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "", dob: "", gender: "",
  educationLevel: "", institution: "", fieldOfStudy: "",
};

const EnrollmentDialog = ({ program, onClose }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user: authUser, token } = useSelector((state) => state.auth);

  const roleName = useMemo(() => {
    const raw = authUser?.role?.role || authUser?.role?.plural || authUser?.role || "";
    return String(raw).toLowerCase().trim();
  }, [authUser]);

  const isDashboardRoute = location?.pathname?.startsWith("/dashboard");
  const isStudent = /student/i.test(roleName);
  const shouldAutoFill = Boolean(token && isDashboardRoute && isStudent);
  const requireFullForm = !isDashboardRoute;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [done, setDone] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [error, setError] = useState("");

  const { data: profileData } = useQuery({
    queryKey: ["enroll-profile", token],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    enabled: shouldAutoFill,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!shouldAutoFill) return;
    const profileUser = profileData?.user;
    if (!profileUser) return;

    const nextFirstName = String(profileUser.first_name || authUser?.first_name || "").trim();
    const nextLastName = String(profileUser.last_name || authUser?.last_name || "").trim();
    const nextEmail = String(profileUser.email || authUser?.email || "").trim();

    setForm((prev) => {
      // Only fill empty fields so we don't overwrite user edits.
      const updated = { ...prev };
      if (!updated.firstName && nextFirstName) updated.firstName = nextFirstName;
      if (!updated.lastName && nextLastName) updated.lastName = nextLastName;
      if (!updated.email && nextEmail) updated.email = nextEmail;
      return updated;
    });
  }, [shouldAutoFill, profileData, authUser]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const enrollMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/programs/${program._id}/enroll`, payload, {
        skipAuth: !isDashboardRoute,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      setEnrollStatus(data?.data?.status || null);
      setDone(true);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to submit enrollment");
    },
  });

  const validate = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
        return "Please fill in your first name, last name and email.";
      }
      if (requireFullForm) {
        if (!form.phone.trim() || !form.gender.trim()) {
          return "Please fill in your phone number and gender.";
        }
      }
    }
    if (step === 2) {
      if (!form.educationLevel) {
        return "Please select your education background.";
      }
      if (requireFullForm) {
        if (!form.institution.trim() || !form.fieldOfStudy.trim()) {
          return "Please fill in your school/institution and field of study.";
        }
      }
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step < STEPS.length) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      await enrollMutation.mutateAsync({
        formData: {
          ...form,
          programTitle: program.title,
        },
      });
    } catch {
      // Error toast is handled by the mutation onError callback.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,20,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-250 bg-white dark:bg-gray-900"
        style={{ maxHeight: "92vh" }}
      >
        {done ? (
          <SuccessScreen program={program} status={enrollStatus} onClose={onClose} />
        ) : (
          <>
            <div className="px-7 pt-7 pb-0 shrink-0">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm shrink-0"
                    style={{ background: program.accent }}
                  >
                    <program.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Enrolling in</p>
                    <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-tight">{program.title}</h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="rounded-3xl border border-orange-100 dark:border-gray-800 bg-linear-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 p-4 mb-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">Free Enrollment</p>
                    <h4 className="mt-1 text-[18px] font-extrabold text-slate-900 dark:text-white">Quick registration</h4>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-300">
                      Fill in your contact details and we&apos;ll save your enrollment for this program.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 border border-orange-100 dark:border-gray-800 shadow-sm min-w-[180px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Program</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-800 dark:text-white">{program.title}</p>
                    <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-300">{program.duration} · {program.teacher}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0 mb-2">
                {STEPS.map((s, i) => {
                  const doneStep = step > s.id;
                  const active = step === s.id;
                  const StepIcon = s.icon;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all duration-300
                            ${doneStep ? "border-orange-500 bg-orange-500 text-white"
                              : active ? "border-orange-500 bg-white text-orange-500 shadow-md shadow-orange-100"
                              : "border-slate-200 bg-white text-slate-400"}`}
                        >
                          {doneStep ? <Check size={13} strokeWidth={3} /> : <StepIcon size={13} />}
                        </div>
                        <span className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block ${active ? "text-orange-500" : doneStep ? "text-slate-500" : "text-slate-300"}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 mx-1 mb-4">
                          <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full transition-all duration-500"
                              style={{ width: step > s.id ? "100%" : "0%" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-2 mb-5">
                <h4 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{STEPS[step - 1].label}</h4>
                <span className="text-[12px] text-slate-400 font-semibold">Step {step} of {STEPS.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 pb-2">
              {step === 1 && <StepPersonal data={form} onChange={update} requireFullForm={requireFullForm} />}
              {step === 2 && <StepEducation data={form} onChange={update} requireFullForm={requireFullForm} />}
            </div>

            {error && (
              <div className="mx-7 mb-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12px] font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="px-7 py-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60 dark:bg-gray-900">
              <button
                type="button"
                onClick={step > 1 ? () => { setError(""); setStep(s => s - 1); } : onClose}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={15} /> {step > 1 ? "Previous" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={next}
                disabled={enrollMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-extrabold transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                style={{ background: program.accent, boxShadow: `0 4px 14px ${program.accent}55` }}
              >
                {enrollMutation.isPending ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : step < STEPS.length ? (
                  <>Next step <ChevronRight size={15} /></>
                ) : (
                  <>Complete registration <Check size={15} /></>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* 
   CARD COMPONENTS
 */

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((i) => (
      <Star key={i} size={11} className={i <= Math.round(rating) ? "fill-orange-400 text-orange-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"} />
    ))}
  </div>
);

const CapacityBar = ({ enrolled, capacity }) => {
  const safeCapacity = Math.max(Number(capacity) || 0, 1);
  const pct = Math.round((Number(enrolled || 0) / safeCapacity) * 100);
  const barColor = pct >= 90 ? "#ef4444" : "#f97316";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><Users size={10} />{enrolled} / {capacity} seats</span>
        <span className="font-semibold" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-orange-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
      </div>
    </div>
  );
};

const ProgramCard = ({ program, onEnroll, alreadyEnrolled = false, hideEnrollAction = false }) => {
  const [flipped, setFlipped] = useState(false);
  const Icon = program.icon;
  const isFull = program.status === "full";
  const bs = BADGE_STYLES[program.badge];
  const enrollDisabled = hideEnrollAction || isFull || alreadyEnrolled;

  return (
    <div
      className="relative h-[420px] cursor-pointer select-none"
      style={{ perspective: "1300px" }}
      onMouseEnter={() => !isFull && setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="w-full h-full relative transition-all duration-500 ease-in-out"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col shadow-sm bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div className="relative h-[110px] overflow-hidden shrink-0" style={{ background: program.accentLight }}>
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-[0.15]" style={{ background: program.accent }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-[0.08]" style={{ background: program.accent }} />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between z-10">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-md" style={{ background: program.accent }}>
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full border" style={{ background: bs.bg, color: bs.color, borderColor: bs.border }}>
                {program.badgeLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col flex-1 px-5 pt-4 pb-0 gap-3 overflow-hidden">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight mb-1.5">{program.title}</h3>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-300 leading-relaxed line-clamp-2">{program.desc}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {program.tags.map((t) => (
                <span key={t} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                  style={{ background: program.accentLight, color: program.accent, borderColor: program.accentMid }}>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[12px] text-slate-400">
              <span className="flex items-center gap-1.5"><Clock size={11} />{program.duration}</span>
              <span className="flex items-center gap-1.5"><GraduationCap size={11} />{program.teacher}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Stars rating={program.rating} />
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{program.rating.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400">({program.reviews} reviews)</span>
            </div>
            <CapacityBar enrolled={program.enrolled} capacity={program.capacity} />
          </div>

          <div className="px-5 py-4 flex items-center justify-between border-t border-slate-50 dark:border-gray-800 mt-2">
            <span className="text-[18px] font-extrabold text-emerald-500">Free</span>
            {isFull
              ? <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl">Program full</span>
              : <span className="text-[11px] text-slate-400 flex items-center gap-1 animate-pulse">Hover to preview <ArrowRight size={11} /></span>
            }
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: program.accent }}
        >
          <div className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />

          <div className="relative z-10 flex flex-col h-full p-7 gap-5">
            <div>
              <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">What you'll learn</p>
              <h3 className="text-white font-extrabold text-[17px] leading-snug">{program.title}</h3>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {program.outcomes.map((o) => (
                <div key={o} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} className="text-white" />
                  </div>
                  <span className="text-white text-[14px] font-medium">{o}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 py-3.5 border-t border-white/20">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-[13px] text-white border-2 border-white/30">
                {program.teacherInitials}
              </div>
              <div>
                <p className="text-white font-bold text-[13px]">{program.teacher}</p>
                <p className="text-white/60 text-[11px]">Lead instructor</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white font-extrabold text-[17px]">Free</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (enrollDisabled) return;
                onEnroll(program);
              }}
              disabled={enrollDisabled}
              className="w-full py-3.5 rounded-2xl font-extrabold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "white", color: program.accent }}
            >
              {hideEnrollAction ? "Assigned program" : alreadyEnrolled ? "Already enrolled" : "Enroll for free"}
              {!hideEnrollAction && !alreadyEnrolled && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/*  Stat  */
const Stat = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center">
      <Icon size={15} className="text-orange-500" />
    </div>
    <div>
      <p className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
);

/* 
   PAGE
 */
const ProgramsPage = () => {
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);
  const { user: authUser } = useSelector((state) => state.auth);
  const [active, setActive] = useState("all");
  const [animKey, setAnimKey] = useState(0);
  const [visible, setVisible] = useState([]);
  const [enrollTarget, setEnrollTarget] = useState(null);

  const isDashboardProgrammeCards = location?.pathname?.startsWith("/dashboard/programmecards");

  const roleName = useMemo(() => {
    const roleSource = authUser?.role;
    if (!roleSource) return "";
    if (typeof roleSource === "object") {
      return String(roleSource.role || roleSource.name || roleSource.title || "").toLowerCase();
    }
    return String(roleSource).toLowerCase();
  }, [authUser]);

  const isInstructorDashboard = isDashboardProgrammeCards && /^(volunteer|teacher|library staff)$/.test(roleName);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["public-programs", { mine: isInstructorDashboard }],
    queryFn: async () => {
      const res = await api.get("/programs", {
        params: {
          page: 1,
          limit: 200,
          ...(isInstructorDashboard ? { mine: true } : {}),
        },
        skipAuth: !isInstructorDashboard,
      });
      const raw = res.data?.data || [];
      const sorted = [...raw].sort((a, b) => {
        const aTime = new Date(a?.createdAt || a?.startDate || 0).getTime() || 0;
        const bTime = new Date(b?.createdAt || b?.startDate || 0).getTime() || 0;
        return bTime - aTime;
      });
      return sorted.map(mapProgramToCard);
    },
    staleTime: 30_000,
  });


  const { data: myEnrollmentsData } = useQuery({
    queryKey: ["my-enrollments", token],
    queryFn: async () => {
      const res = await api.get("/users/me/enrollments");
      return res.data;
    },
    enabled: Boolean(token && isDashboardProgrammeCards),
    staleTime: 30_000,
  });

  const enrolledProgramIds = useMemo(() => {
    const items = myEnrollmentsData?.data || [];
    const relevant = new Set(
      items
        .filter((e) => ["pending", "confirmed", "waitlisted"].includes(String(e?.status || "")))
        .map((e) => String(e?.programId))
    );
    return relevant;
  }, [myEnrollmentsData]);

  useEffect(() => {
    const nextVisible = active === "all" ? programs : programs.filter(p => p.category === active);
    const sorted = [...nextVisible].sort((a, b) => {
      const aTime = new Date(a?.createdAt || a?.startDate || 0).getTime() || 0;
      const bTime = new Date(b?.createdAt || b?.startDate || 0).getTime() || 0;
      return bTime - aTime;
    });
    setVisible(sorted);
    setAnimKey(k => k + 1);
  }, [active, programs]);

  const activeLearners = programs.reduce((sum, program) => sum + Number(program.enrolled || 0), 0);
  const hideHero = isDashboardProgrammeCards;

  return (
    <div className="min-h-screen px-4 pt-16 pb-20 bg-slate-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">

       {!hideHero && (
              <div className="mb-32">
                <HeroHeader />
              </div>
            )}

    
          


        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-500 dark:text-orange-300 text-[12px] font-bold mb-6">
            <Sparkles size={12} /> Expert-led · Outcome-focused · Flexible
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-[52px] font-extrabold text-slate-900 dark:text-white leading-[1.08] tracking-tight">
                Build skills that{" "}
                <span className="relative whitespace-nowrap">
                  <span className="text-orange-500">open doors</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" height="8" viewBox="0 0 300 8" preserveAspectRatio="none">
                    <path d="M0 5 Q37 1 75 5 Q112 9 150 5 Q187 1 225 5 Q262 9 300 5" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </span>
              </h1>
              <p className="mt-5 text-[16px] text-slate-500 dark:text-slate-300 leading-[1.75] max-w-lg">
                Practical, hands-on programs designed by industry professionals. Whether you're switching careers, leveling up, or exploring something new — we have a program built for your goals.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 shrink-0 lg:pb-1">
              <Stat icon={Users} value={String(activeLearners)} label="Active learners" />
              <Stat icon={Star} value="4.8 / 5" label="Avg rating" />
              <Stat icon={Flame} value={String(programs.length)} label="Programs now" />
            </div>
          </div>
          {/* <div className="mt-10 h-px bg-linear-to-r from-orange-200 via-slate-100 to-transparent" /> */}
        </div>

        <div className="flex  items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setActive(key)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200
                  ${active === key ? "bg-orange-500 text-white shadow-md shadow-orange-200 scale-[1.02]"
                    : " text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-800"}`}>
                {label}
              </button>
            ))}
          </div>
          <span className="text-[13px] text-slate-400 font-medium">{visible.length} program{visible.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading ? (
          <div className="py-24 text-center">
            <p className="text-slate-400 font-semibold">Loading programs…</p>
          </div>
        ) : (
          <div key={animKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p, i) => (
              <div key={p.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                <ProgramCard
                  program={p}
                  onEnroll={setEnrollTarget}
                  alreadyEnrolled={enrolledProgramIds.has(String(p.id))}
                  hideEnrollAction={isInstructorDashboard}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <div className="py-24 text-center">
            <Globe size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 font-semibold">No programs in this category yet.</p>
          </div>
        )}

        {/* <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-5 px-8 py-7 rounded-3xl bg-orange-50 border border-orange-100">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-900">Not sure where to start?</h3>
            <p className="text-[13px] text-slate-500 mt-1">Talk to an advisor — we'll match you with the right program.</p>
          </div>
          <Button className="shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-200 px-6 gap-2">
            Get matched <ArrowRight size={14} />
          </Button>
        </div> */}
      </div>

      {!isDashboardProgrammeCards && (
        <div className="max-w-7xl mx-auto mt-20">
          <Footer clubLogoSrc="/jjuclub.jpg" />
        </div>
      )}

      {enrollTarget && (
        isDashboardProgrammeCards ? (
          <ConfirmEnrollDialog
            program={enrollTarget}
            onClose={() => setEnrollTarget(null)}
          />
        ) : (
          <EnrollmentDialog
            program={enrollTarget}
            onClose={() => setEnrollTarget(null)}
          />
        )
      )}
    </div>
  );
};

export default ProgramsPage;
