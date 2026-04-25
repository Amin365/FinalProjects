import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Clock, Users, Star, BookOpen, ChevronRight, ChevronLeft,
  Sparkles, TrendingUp, Globe, Flame, X,
  GraduationCap, BarChart3, Palette, Shield, Bot,
  ArrowRight, CheckCircle2, User, Phone, Mail,
  MapPin, Briefcase, BookMarked, Target, Check,
} from "lucide-react";

import Heros from "../Homepage/HeroSections";


/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */
/* single brand palette — every card uses these */
const OR = { accent: "#f97316", accentLight: "#fff7ed", accentMid: "#fed7aa" };

const PROGRAMS = [
  {
    id: 1, category: "tech", icon: BookOpen, ...OR,
    badge: "featured", badgeLabel: "Featured",
    title: "Full-stack web development",
    desc: "Master React, Node.js, databases and deployment. Go from zero to job-ready in 16 weeks.",
    teacher: "Amara Diallo", teacherInitials: "AD",
    duration: "16 weeks", enrolled: 34, capacity: 40,
    rating: 4.9, reviews: 128, price: 299, free: false, status: "open",
    tags: ["React", "Node.js", "MongoDB"],
    outcomes: ["Build full-stack apps", "Deploy to cloud", "Land a dev job"],
  },
  {
    id: 2, category: "data", icon: BarChart3, ...OR,
    badge: "new", badgeLabel: "New",
    title: "Data science & machine learning",
    desc: "Python, statistics and ML models. Build real AI systems from scratch to production.",
    teacher: "Lena Hartmann", teacherInitials: "LH",
    duration: "12 weeks", enrolled: 18, capacity: 30,
    rating: 4.8, reviews: 42, price: 349, free: false, status: "open",
    tags: ["Python", "TensorFlow", "SQL"],
    outcomes: ["Train ML models", "Analyze datasets", "Deploy APIs"],
  },
  {
    id: 3, category: "design", icon: Palette, ...OR,
    badge: "full", badgeLabel: "Full",
    title: "UI/UX design fundamentals",
    desc: "Figma, design systems, user research and prototyping. Become a sought-after product designer.",
    teacher: "Sofia Mendes", teacherInitials: "SM",
    duration: "8 weeks", enrolled: 25, capacity: 25,
    rating: 4.7, reviews: 87, price: 0, free: true, status: "full",
    tags: ["Figma", "Research", "Systems"],
    outcomes: ["Design products", "Build systems", "Ship polished UI"],
  },
  {
    id: 4, category: "business", icon: TrendingUp, ...OR,
    badge: "soon", badgeLabel: "Starting soon",
    title: "Digital marketing & growth",
    desc: "SEO, paid ads, content strategy and email funnels. A full playbook for online growth.",
    teacher: "Carlos Vega", teacherInitials: "CV",
    duration: "10 weeks", enrolled: 9, capacity: 35,
    rating: 4.6, reviews: 61, price: 199, free: false, status: "open",
    tags: ["SEO", "Analytics", "Paid Ads"],
    outcomes: ["Drive traffic", "Run campaigns", "Grow revenue"],
  },
  {
    id: 5, category: "tech", icon: Shield, ...OR,
    badge: "active", badgeLabel: "Active",
    title: "Cybersecurity essentials",
    desc: "Ethical hacking, threat analysis and secure system design for devs and IT pros.",
    teacher: "James Osei", teacherInitials: "JO",
    duration: "14 weeks", enrolled: 20, capacity: 30,
    rating: 4.9, reviews: 54, price: 279, free: false, status: "open",
    tags: ["Hacking", "Networking", "Security"],
    outcomes: ["Find vulnerabilities", "Secure systems", "Get certified"],
  },
  {
    id: 6, category: "data", icon: Bot, ...OR,
    badge: "new", badgeLabel: "New",
    title: "AI prompt engineering",
    desc: "Build powerful AI workflows, craft effective prompts and integrate LLMs into products.",
    teacher: "Yuki Tanaka", teacherInitials: "YT",
    duration: "6 weeks", enrolled: 11, capacity: 40,
    rating: 5.0, reviews: 19, price: 0, free: true, status: "open",
    tags: ["ChatGPT", "Claude", "Automation"],
    outcomes: ["Master prompting", "Build AI apps", "Automate workflows"],
  },
];

const FILTERS = [
  { key: "all", label: "All programs" },
  { key: "tech", label: "Technology" },
  { key: "business", label: "Business" },
  { key: "design", label: "Design" },
  { key: "data", label: "Data & AI" },
];

const BADGE_STYLES = {
  featured: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  new:      { bg: "#fff7ed", color: "#ea580c", border: "#fdba74" },
  active:   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  soon:     { bg: "#fff3e8", color: "#9a3412", border: "#fed7aa" },
  full:     { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
};

/* ══════════════════════════════════════════════════════════════
   ENROLLMENT DIALOG — 4 steps
══════════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 1, label: "Personal info",   icon: User },
  { id: 2, label: "Education",       icon: BookMarked },
  { id: 3, label: "Experience",      icon: Briefcase },
  { id: 4, label: "Goals",           icon: Target },
];

const EDUCATION_LEVELS = [
  "High school diploma",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "PhD / Doctorate",
  "Professional certification",
  "Self-taught / No formal degree",
];

const FIELDS_OF_STUDY = [
  "Computer science", "Engineering", "Business / Management",
  "Design / Arts", "Mathematics / Statistics", "Natural sciences",
  "Social sciences", "Medicine / Health", "Law", "Other",
];

const EXPERIENCE_LEVELS = [
  { value: "none",     label: "No experience",       desc: "Completely new to this field" },
  { value: "beginner", label: "Beginner",             desc: "Less than 1 year" },
  { value: "junior",   label: "Junior",               desc: "1–2 years" },
  { value: "mid",      label: "Mid-level",            desc: "3–5 years" },
  { value: "senior",   label: "Senior",               desc: "5+ years" },
];

const MOTIVATIONS = [
  "Switch careers", "Get a promotion", "Freelance / start a business",
  "Build a personal project", "Academic interest", "Upskill at current job",
];

/* small helpers */
const inputCls =
  "w-full px-4 py-3 rounded-xl text-[13px] bg-slate-50 border border-slate-200 " +
  "text-slate-800 placeholder:text-slate-300 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all";

const Label = ({ children, req }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
    {children}{req && <span className="text-orange-400 ml-0.5">*</span>}
  </label>
);

const FieldWrap = ({ children, className = "" }) => (
  <div className={`flex flex-col ${className}`}>{children}</div>
);

/* Step 1 — Personal information */
const StepPersonal = ({ data, onChange }) => (
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
      <Label>Phone number</Label>
      <div className="relative">
        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="+1 555 000 0000" value={data.phone} onChange={e => onChange("phone", e.target.value)} />
      </div>
    </FieldWrap>
    {/* <FieldWrap>
      <Label>Country</Label>
      <div className="relative">
        <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="United States" value={data.country} onChange={e => onChange("country", e.target.value)} />
      </div>
    </FieldWrap> */}
    <FieldWrap>
      <Label>Date of birth</Label>
      <input className={inputCls} type="date" value={data.dob} onChange={e => onChange("dob", e.target.value)} />
    </FieldWrap>
    <FieldWrap>
      <Label>Gender</Label>
      <div className="relative">
        <select className={`${inputCls} appearance-none`} value={data.gender} onChange={e => onChange("gender", e.target.value)}>
          <option value="">Select…</option>
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
          <option>Prefer not to say</option>
        </select>
        <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
      </div>
    </FieldWrap>
  </div>
);

/* Step 2 — Education */
const StepEducation = ({ data, onChange }) => (
  <div className="flex flex-col gap-5">
    <FieldWrap>
      <Label req>Highest level of education</Label>
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
                  ? "border-orange-400 bg-orange-50 text-orange-700 ring-2 ring-orange-100"
                  : "border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50/50"
                }`}
            >
              <span className={`mr-2 inline-block w-3.5 h-3.5 rounded-full border-2 align-middle transition-colors ${active ? "border-orange-500 bg-orange-500" : "border-slate-300"}`} />
              {lvl}
            </button>
          );
        })}
      </div>
    </FieldWrap>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FieldWrap>
        <Label>Field of study</Label>
        <div className="relative">
          <select className={`${inputCls} appearance-none`} value={data.fieldOfStudy} onChange={e => onChange("fieldOfStudy", e.target.value)}>
            <option value="">Select…</option>
            {FIELDS_OF_STUDY.map(f => <option key={f}>{f}</option>)}
          </select>
          <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
        </div>
      </FieldWrap>
      <FieldWrap>
        <Label>Institution name</Label>
        <input className={inputCls} placeholder="MIT, Harvard…" value={data.institution} onChange={e => onChange("institution", e.target.value)} />
      </FieldWrap>
      <FieldWrap>
        <Label>Graduation year</Label>
        <input className={inputCls} placeholder="2020" type="number" min="1960" max="2030" value={data.gradYear} onChange={e => onChange("gradYear", e.target.value)} />
      </FieldWrap>
      <FieldWrap>
        <Label>GPA / Grade (optional)</Label>
        <input className={inputCls} placeholder="3.8 / 4.0" value={data.gpa} onChange={e => onChange("gpa", e.target.value)} />
      </FieldWrap>
    </div>
  </div>
);

/* Step 3 — Experience */
const StepExperience = ({ data, onChange }) => (
  <div className="flex flex-col gap-5">
    <FieldWrap>
      <Label req>Experience level in this field</Label>
      <div className="flex flex-col gap-2 mt-1">
        {EXPERIENCE_LEVELS.map(({ value, label, desc }) => {
          const active = data.experienceLevel === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange("experienceLevel", value)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all duration-150
                ${active
                  ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                  : "border-slate-200 hover:border-orange-200 hover:bg-orange-50/40"
                }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center
                ${active ? "border-orange-500 bg-orange-500" : "border-slate-300"}`}>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span>
                <span className={`block text-[13px] font-bold ${active ? "text-orange-700" : "text-slate-700"}`}>{label}</span>
                <span className="block text-[12px] text-slate-400">{desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </FieldWrap>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FieldWrap>
        <Label>Current job title</Label>
        <div className="relative">
          <Briefcase size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Software Engineer" value={data.jobTitle} onChange={e => onChange("jobTitle", e.target.value)} />
        </div>
      </FieldWrap>
      <FieldWrap>
        <Label>Company / Organisation</Label>
        <input className={inputCls} placeholder="Acme Corp" value={data.company} onChange={e => onChange("company", e.target.value)} />
      </FieldWrap>
    </div>

    <FieldWrap>
      <Label>Relevant skills you already have</Label>
      <input className={inputCls} placeholder="e.g. HTML, CSS, basic Python…" value={data.existingSkills} onChange={e => onChange("existingSkills", e.target.value)} />
      <p className="text-[11px] text-slate-400 mt-1.5">Separate with commas</p>
    </FieldWrap>
  </div>
);

/* Step 4 — Goals */
const StepGoals = ({ data, onChange }) => {
  const toggleMotivation = (m) => {
    const arr = data.motivations.includes(m)
      ? data.motivations.filter(x => x !== m)
      : [...data.motivations, m];
    onChange("motivations", arr);
  };

  return (
    <div className="flex flex-col gap-5">
    <Heros />
      <FieldWrap>
        <Label req>Why are you enrolling? (pick all that apply)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {MOTIVATIONS.map((m) => {
            const active = data.motivations.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMotivation(m)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium text-left transition-all duration-150
                  ${active
                    ? "border-orange-400 bg-orange-50 text-orange-700 ring-2 ring-orange-100"
                    : "border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
              >
                <span className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors
                  ${active ? "border-orange-500 bg-orange-500" : "border-slate-300"}`}>
                  {active && <Check size={10} className="text-white" strokeWidth={3} />}
                </span>
                {m}
              </button>
            );
          })}
        </div>
      </FieldWrap>

      <FieldWrap>
        <Label>Hours available per week</Label>
        <div className="relative">
          <select className={`${inputCls} appearance-none`} value={data.hoursPerWeek} onChange={e => onChange("hoursPerWeek", e.target.value)}>
            <option value="">Select…</option>
            <option>Less than 5 hours</option>
            <option>5–10 hours</option>
            <option>10–20 hours</option>
            <option>20–30 hours</option>
            <option>Full-time (30+ hours)</option>
          </select>
          <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
        </div>
      </FieldWrap>

      <FieldWrap>
        <Label>Preferred learning style</Label>
        <div className="flex flex-wrap gap-2">
          {["Video lectures", "Reading / docs", "Hands-on projects", "Live sessions", "Peer discussion"].map((s) => {
            const active = data.learningStyle === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange("learningStyle", s)}
                className={`px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-all
                  ${active ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-500 hover:border-orange-200"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </FieldWrap>

      <FieldWrap>
        <Label>Anything else you'd like us to know?</Label>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Accessibility needs, specific goals, questions for the instructor…"
          value={data.notes}
          onChange={e => onChange("notes", e.target.value)}
        />
      </FieldWrap>
    </div>
  );
};

/* ── Success screen ─────────────────────────────────────────── */
const SuccessScreen = ({ program, onClose }) => (
  <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-5">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
      style={{ background: program.accent }}
    >
      <Check size={36} className="text-white" strokeWidth={3} />
    </div>
    <div>
      <h3 className="text-[22px] font-extrabold text-slate-900 mb-2">You're enrolled! 🎉</h3>
      <p className="text-[14px] text-slate-500 max-w-sm leading-relaxed">
        Welcome to <span className="font-bold text-slate-800">{program.title}</span>. Check your email for confirmation and next steps.
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
        <p className="text-[13px] font-bold text-slate-800">{program.title}</p>
        <p className="text-[12px] text-slate-500">{program.duration} · with {program.teacher}</p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-[16px] font-extrabold" style={{ color: program.accent }}>
          {program.free ? "Free" : `$${program.price}`}
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

/* ── Enrollment Dialog ──────────────────────────────────────── */
const EMPTY_FORM = {
  // step 1
  firstName: "", lastName: "", email: "", phone: "", country: "", dob: "", gender: "",
  // step 2
  educationLevel: "", fieldOfStudy: "", institution: "", gradYear: "", gpa: "",
  // step 3
  experienceLevel: "", jobTitle: "", company: "", existingSkills: "",
  // step 4
  motivations: [], hoursPerWeek: "", learningStyle: "", notes: "",
};

const EnrollmentDialog = ({ program, onClose }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    if (step === 1 && (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim())) {
      return "Please fill in your first name, last name and email.";
    }
    if (step === 2 && !form.educationLevel) return "Please select your education level.";
    if (step === 3 && !form.experienceLevel) return "Please select your experience level.";
    if (step === 4 && form.motivations.length === 0) return "Please select at least one motivation.";
    return null;
  };

  const [error, setError] = useState("");

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step < 4) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Replace with real API call:
    // await api.post("/enrollments", { programId: program.id, ...form });
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setDone(true);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,20,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-250"
        style={{ maxHeight: "92vh" }}
      >
        {done ? (
          <SuccessScreen program={program} onClose={onClose} />
        ) : (
          <>
            {/* Dialog header */}
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
                    <h3 className="text-[15px] font-extrabold text-slate-900 leading-tight">{program.title}</h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-0 mb-1">
                {STEPS.map((s, i) => {
                  const done = step > s.id;
                  const active = step === s.id;
                  const StepIcon = s.icon;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all duration-300
                            ${done ? "border-orange-500 bg-orange-500 text-white"
                              : active ? "border-orange-500 bg-white text-orange-500 shadow-md shadow-orange-100"
                              : "border-slate-200 bg-white text-slate-400"}`}
                        >
                          {done ? <Check size={13} strokeWidth={3} /> : <StepIcon size={13} />}
                        </div>
                        <span className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block ${active ? "text-orange-500" : done ? "text-slate-500" : "text-slate-300"}`}>
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

              {/* Overall progress bar */}
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress + 25}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 mb-5">
                <h4 className="text-[16px] font-extrabold text-slate-900">
                  {STEPS[step - 1].label}
                </h4>
                <span className="text-[12px] text-slate-400 font-semibold">Step {step} of {STEPS.length}</span>
              </div>
            </div>

            {/* Scrollable step content */}
            <div className="flex-1 overflow-y-auto px-7 pb-2">
              {step === 1 && <StepPersonal data={form} onChange={update} />}
              {step === 2 && <StepEducation data={form} onChange={update} />}
              {step === 3 && <StepExperience data={form} onChange={update} />}
              {step === 4 && <StepGoals data={form} onChange={update} />}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-7 mb-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[12px] font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Footer nav */}
            <div className="px-7 py-5 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => { setError(""); setStep(s => s - 1); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-bold hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={next}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-extrabold transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                style={{ background: program.accent, boxShadow: `0 4px 14px ${program.accent}55` }}
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : step < 4 ? (
                  <>Next step <ChevronRight size={15} /></>
                ) : (
                  <>Complete enrollment <Check size={15} /></>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CARD COMPONENTS
══════════════════════════════════════════════════════════════ */

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((i) => (
      <Star key={i} size={11} className={i <= Math.round(rating) ? "fill-orange-400 text-orange-400" : "fill-slate-200 text-slate-200"} />
    ))}
  </div>
);

const CapacityBar = ({ enrolled, capacity }) => {
  const pct = Math.round((enrolled / capacity) * 100);
  const barColor = pct >= 90 ? "#ef4444" : "#f97316";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><Users size={10} />{enrolled} / {capacity} seats</span>
        <span className="font-semibold" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-orange-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
};

const ProgramCard = ({ program, onEnroll }) => {
  const [flipped, setFlipped] = useState(false);
  const Icon = program.icon;
  const isFull = program.status === "full";
  const bs = BADGE_STYLES[program.badge];

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
        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-[24px] bg-white border border-slate-100 overflow-hidden flex flex-col shadow-sm"
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
              <h3 className="text-[15px] font-bold text-slate-900 leading-tight mb-1.5">{program.title}</h3>
              <p className="text-[12.5px] text-slate-500 leading-relaxed line-clamp-2">{program.desc}</p>
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
              <span className="text-[12px] font-bold text-slate-700">{program.rating.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400">({program.reviews} reviews)</span>
            </div>
            <CapacityBar enrolled={program.enrolled} capacity={program.capacity} />
          </div>

          <div className="px-5 py-4 flex items-center justify-between border-t border-slate-50 mt-2">
            {program.free
              ? <span className="text-[18px] font-extrabold text-emerald-500">Free</span>
              : <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-extrabold text-slate-900">${program.price}</span>
                  <span className="text-[11px] text-slate-400">/ program</span>
                </div>
            }
            {isFull
              ? <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">Program full</span>
              : <span className="text-[11px] text-slate-400 flex items-center gap-1 animate-pulse">Hover to preview <ArrowRight size={11} /></span>
            }
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-[24px] overflow-hidden flex flex-col"
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
                <p className="text-white font-extrabold text-[17px]">{program.free ? "Free" : `$${program.price}`}</p>
                {!program.free && <p className="text-white/50 text-[10px]">one-time</p>}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onEnroll(program); }}
              className="w-full py-3.5 rounded-2xl font-extrabold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] hover:opacity-90"
              style={{ background: "white", color: program.accent }}
            >
              {program.free ? "Enroll for free" : `Enroll now · $${program.price}`}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Stat ────────────────────────────────────────────────────── */
const Stat = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
      <Icon size={15} className="text-orange-500" />
    </div>
    <div>
      <p className="text-[15px] font-extrabold text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
const ProgramsPage = () => {
  const [active, setActive] = useState("all");
  const [animKey, setAnimKey] = useState(0);
  const [visible, setVisible] = useState(PROGRAMS);
  const [enrollTarget, setEnrollTarget] = useState(null);

  useEffect(() => {
    setVisible(active === "all" ? PROGRAMS : PROGRAMS.filter(p => p.category === active));
    setAnimKey(k => k + 1);
  }, [active]);

  return (
    <div className="min-h-screen bg-white px-4 pt-16 pb-20">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-500 text-[12px] font-bold mb-6">
            <Sparkles size={12} /> Expert-led · Outcome-focused · Flexible
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-[52px] font-extrabold text-slate-900 leading-[1.08] tracking-tight">
                Build skills that{" "}
                <span className="relative whitespace-nowrap">
                  <span className="text-orange-500">open doors</span>
                  <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" height="8" viewBox="0 0 300 8" preserveAspectRatio="none">
                    <path d="M0 5 Q37 1 75 5 Q112 9 150 5 Q187 1 225 5 Q262 9 300 5" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </span>
              </h1>
              <p className="mt-5 text-[16px] text-slate-500 leading-[1.75] max-w-lg">
                Practical, hands-on programs designed by industry professionals. Whether you're switching careers, leveling up, or exploring something new — we have a program built for your goals.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 shrink-0 lg:pb-1">
              <Stat icon={Users} value="2,400+" label="Active learners" />
              <Stat icon={Star}  value="4.8 / 5" label="Avg rating" />
              <Stat icon={Flame} value="6 live"  label="Programs now" />
            </div>
          </div>
          <div className="mt-10 h-px bg-gradient-to-r from-orange-200 via-slate-100 to-transparent" />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setActive(key)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200
                  ${active === key ? "bg-orange-500 text-white shadow-md shadow-orange-200 scale-[1.02]"
                    : "bg-white text-slate-500 border border-slate-200 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200"}`}>
                {label}
              </button>
            ))}
          </div>
          <span className="text-[13px] text-slate-400 font-medium">{visible.length} program{visible.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Cards */}
        <div key={animKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((p, i) => (
            <div key={p.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <ProgramCard program={p} onEnroll={setEnrollTarget} />
            </div>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="py-24 text-center">
            <Globe size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 font-semibold">No programs in this category yet.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-5 px-8 py-7 rounded-3xl bg-orange-50 border border-orange-100">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-900">Not sure where to start?</h3>
            <p className="text-[13px] text-slate-500 mt-1">Talk to an advisor — we'll match you with the right program.</p>
          </div>
          <Button className="shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-200 px-6 gap-2">
            Get matched <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {/* Enrollment dialog */}
      {enrollTarget && (
        <EnrollmentDialog
          program={enrollTarget}
          onClose={() => setEnrollTarget(null)}
        />
      )}
    </div>
  );
};

export default ProgramsPage;