import { useState } from "react";
import {
  X, ChevronRight, ChevronLeft, Check,
  Users, Heart, Mail, Phone, MapPin,
  User, Briefcase, MessageSquare, Sparkles,
} from "lucide-react";
import HeroHeader from '../Homepage/HeroSections'


/* 
   TEAM DATA  — swap with API data as needed
 */
const TEAM = {
  root: {
    id: "root",
    name: "Amara Patel",
    role: "Club President",
    initials: "AP",
    bio: "Leading the club since 2022 with a vision of community-first education.",
  },
  vps: [
    { id: "vp1", name: "Jin Kim",    role: "VP Programs",  initials: "JK", group: "programs"  },
    { id: "vp2", name: "Sofia Osei", role: "VP Community", initials: "SO", group: "community" },
    { id: "vp3", name: "Marcus R.",  role: "VP Resources", initials: "MR", group: "resources" },
  ],
  leads: [
    { id: "l1", name: "Lena H.",    role: "Curriculum",  initials: "LH", group: "programs"  },
    { id: "l2", name: "Dev M.",     role: "Events",      initials: "DM", group: "programs"  },
    { id: "l3", name: "Carlos L.",  role: "Outreach",    initials: "CL", group: "community" },
    { id: "l4", name: "Yuki T.",    role: "Social Media",initials: "YT", group: "community" },
    { id: "l5", name: "Aisha N.",   role: "Library",     initials: "AN", group: "resources" },
    { id: "l6", name: "James O.",   role: "Tech",        initials: "JO", group: "resources" },
  ],
  volunteers: [
    { id: "v1",  name: "Volunteer",  role: "Curriculum",  initials: "V1",  group: "programs"  },
    { id: "v2",  name: "Volunteer",  role: "Curriculum",  initials: "V2",  group: "programs"  },
    { id: "v3",  name: "Volunteer",  role: "Events",      initials: "V3",  group: "programs"  },
    { id: "v4",  name: "Volunteer",  role: "Events",      initials: "V4",  group: "programs"  },
    { id: "v5",  name: "Volunteer",  role: "Outreach",    initials: "V5",  group: "community" },
    { id: "v6",  name: "Volunteer",  role: "Outreach",    initials: "V6",  group: "community" },
    { id: "v7",  name: "Volunteer",  role: "Social",      initials: "V7",  group: "community" },
    { id: "v8",  name: "Volunteer",  role: "Social",      initials: "V8",  group: "community" },
    { id: "v9",  name: "Volunteer",  role: "Library",     initials: "V9",  group: "resources" },
    { id: "v10", name: "Volunteer",  role: "Library",     initials: "V10", group: "resources" },
    { id: "v11", name: "Volunteer",  role: "Tech",        initials: "V11", group: "resources" },
    { id: "v12", name: "Volunteer",  role: "Tech",        initials: "V12", group: "resources" },
  ],
};

/* 
   VOLUNTEER DIALOG — 3 steps
 */
const DIALOG_STEPS = [
  { id: 1, label: "Personal info",  icon: User },
  { id: 2, label: "Background",     icon: Briefcase },
  { id: 3, label: "Motivation",     icon: Heart },
];

const AREAS = [
  "Programs & Curriculum", "Events & Workshops",
  "Community Outreach", "Social Media", "Library & Resources", "Tech & Website",
];

const AVAILABILITY = ["Weekdays mornings", "Weekday evenings", "Weekends", "Flexible / remote only"];

const inputCls =
  "w-full px-4 py-3 rounded-xl text-[13px] bg-slate-50 dark:bg-gray-800 " +
  "border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-100 " +
  "placeholder:text-slate-300 dark:placeholder:text-gray-600 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all";

const FL = ({ children, req }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}{req && <span className="text-orange-500 ml-0.5">*</span>}
  </label>
);

const Step1 = ({ data, set }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <FL req>First name</FL>
      <input className={inputCls} placeholder="John" value={data.firstName} onChange={e => set("firstName", e.target.value)} />
    </div>
    <div>
      <FL req>Last name</FL>
      <input className={inputCls} placeholder="Doe" value={data.lastName} onChange={e => set("lastName", e.target.value)} />
    </div>
    <div className="sm:col-span-2">
      <FL req>Email address</FL>
      <div className="relative">
        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="john@example.com" type="email" value={data.email} onChange={e => set("email", e.target.value)} />
      </div>
    </div>
    <div>
      <FL>Phone</FL>
      <div className="relative">
        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="+1 555 000 0000" value={data.phone} onChange={e => set("phone", e.target.value)} />
      </div>
    </div>
    <div>
      <FL>City / Country</FL>
      <div className="relative">
        <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className={`${inputCls} pl-9`} placeholder="Addis Ababa, Ethiopia" value={data.location} onChange={e => set("location", e.target.value)} />
      </div>
    </div>
    <div>
      <FL>Age</FL>
      <input className={inputCls} placeholder="24" type="number" min={16} max={99} value={data.age} onChange={e => set("age", e.target.value)} />
    </div>
    <div>
      <FL>Gender</FL>
      <div className="relative">
        <select className={`${inputCls} appearance-none`} value={data.gender} onChange={e => set("gender", e.target.value)}>
          <option value="">Select…</option>
          <option>Male</option><option>Female</option>
          <option>Non-binary</option><option>Prefer not to say</option>
        </select>
        <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
      </div>
    </div>
  </div>
);

const Step2 = ({ data, set }) => (
  <div className="flex flex-col gap-4">
    <div>
      <FL req>Which area would you like to volunteer in?</FL>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {AREAS.map(a => {
          const active = data.area === a;
          return (
            <button key={a} type="button" onClick={() => set("area", a)}
              className={`text-left px-4 py-3 rounded-xl border text-[13px] font-medium transition-all
                ${active ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-2 ring-orange-100 dark:ring-orange-900/30"
                         : "border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-orange-200 hover:bg-orange-50/50"}`}>
              <span className={`mr-2 inline-block w-3 h-3 rounded-full border-2 align-middle transition-colors ${active ? "border-orange-500 bg-orange-500" : "border-slate-300"}`} />
              {a}
            </button>
          );
        })}
      </div>
    </div>
    <div>
      <FL>Availability</FL>
      <div className="flex flex-wrap gap-2">
        {AVAILABILITY.map(av => {
          const active = data.availability === av;
          return (
            <button key={av} type="button" onClick={() => set("availability", av)}
              className={`px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-all
                ${active ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                         : "border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:border-orange-200"}`}>
              {av}
            </button>
          );
        })}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <FL>Current occupation</FL>
        <input className={inputCls} placeholder="Student / Engineer…" value={data.occupation} onChange={e => set("occupation", e.target.value)} />
      </div>
      <div>
        <FL>Relevant skills</FL>
        <input className={inputCls} placeholder="Design, writing, coding…" value={data.skills} onChange={e => set("skills", e.target.value)} />
      </div>
    </div>
    <div>
      <FL>Have you volunteered before?</FL>
      <div className="flex gap-3">
        {["Yes", "No"].map(v => {
          const active = data.prevExp === v;
          return (
            <button key={v} type="button" onClick={() => set("prevExp", v)}
              className={`flex-1 py-2.5 rounded-xl border text-[13px] font-semibold transition-all
                ${active ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                         : "border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-orange-200"}`}>
              {v}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const Step3 = ({ data, set }) => (
  <div className="flex flex-col gap-4">
    <div>
      <FL req>Why do you want to volunteer with us?</FL>
      <textarea rows={4} className={`${inputCls} resize-none`}
        placeholder="Tell us what drives you to contribute to this community…"
        value={data.motivation} onChange={e => set("motivation", e.target.value)} />
    </div>
    <div>
      <FL>What do you hope to gain from this experience?</FL>
      <textarea rows={3} className={`${inputCls} resize-none`}
        placeholder="Skills, connections, personal growth…"
        value={data.goals} onChange={e => set("goals", e.target.value)} />
    </div>
    <div>
      <FL>Hours you can commit per week</FL>
      <div className="relative">
        <select className={`${inputCls} appearance-none`} value={data.hoursPerWeek} onChange={e => set("hoursPerWeek", e.target.value)}>
          <option value="">Select…</option>
          <option>1–3 hours</option><option>3–5 hours</option>
          <option>5–10 hours</option><option>10+ hours</option>
        </select>
        <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
      </div>
    </div>
    <div>
      <FL>Anything else we should know?</FL>
      <textarea rows={2} className={`${inputCls} resize-none`}
        placeholder="Accessibility needs, special circumstances…"
        value={data.notes} onChange={e => set("notes", e.target.value)} />
    </div>
  </div>
);

const EMPTY = {
  firstName: "", lastName: "", email: "", phone: "", location: "", age: "", gender: "",
  area: "", availability: "", occupation: "", skills: "", prevExp: "",
  motivation: "", goals: "", hoursPerWeek: "", notes: "",
};

const VolunteerDialog = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    if (step === 1 && (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()))
      return "Please fill in first name, last name and email.";
    if (step === 2 && !form.area)
      return "Please select a volunteer area.";
    if (step === 3 && !form.motivation.trim())
      return "Please tell us your motivation.";
    return "";
  };

  const next = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step < 3) { setStep(s => s + 1); return; }
    setSubmitting(true);
    // replace with: await api.post("/volunteers", form);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setDone(true);
  };

  const progress = Math.round(((step - 1) / 2) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,20,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[28px] overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "92vh" }}>

        {done ? (
          <div className="flex flex-col items-center py-12 px-8 text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-200">
              <Check size={36} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-[22px] font-extrabold text-slate-900 dark:text-white mb-2">Application submitted! 🎉</h3>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                Thank you, <span className="font-bold text-slate-800 dark:text-slate-200">{form.firstName}</span>! We'll review your application and reach out within 3–5 business days.
              </p>
            </div>
            <div className="w-full rounded-2xl p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                <Heart size={16} className="text-white fill-white" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">{form.area || "Volunteer"}</p>
                <p className="text-[11px] text-slate-400">{form.availability || "Flexible"}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="mt-2 px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[13px] shadow-md shadow-orange-200 transition-all">
              Back to team
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-7 pt-7 pb-0 shrink-0">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-orange-500 flex items-center justify-center shadow-sm shrink-0">
                    <Heart size={17} className="text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Joining the team</p>
                    <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">Volunteer Application</h3>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                  <X size={15} />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-0 mb-1">
                {DIALOG_STEPS.map((s, i) => {
                  const isDone = step > s.id;
                  const isActive = step === s.id;
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                          ${isDone ? "border-orange-500 bg-orange-500 text-white"
                            : isActive ? "border-orange-500 bg-white dark:bg-gray-900 text-orange-500 shadow-md shadow-orange-100 dark:shadow-orange-900/20"
                            : "border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-400"}`}>
                          {isDone ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                        </div>
                        <span className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block
                          ${isActive ? "text-orange-500" : isDone ? "text-slate-500" : "text-slate-300 dark:text-slate-600"}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < DIALOG_STEPS.length - 1 && (
                        <div className="flex-1 mx-1 mb-4">
                          <div className="h-0.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full transition-all duration-500"
                              style={{ width: step > s.id ? "100%" : "0%" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress + 34}%` }} />
              </div>
              <div className="flex justify-between items-center mt-2 mb-5">
                <h4 className="text-[16px] font-extrabold text-slate-900 dark:text-white">
                  {DIALOG_STEPS[step - 1].label}
                </h4>
                <span className="text-[12px] text-slate-400 font-semibold">Step {step} of 3</span>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-7 pb-2">
              {step === 1 && <Step1 data={form} set={update} />}
              {step === 2 && <Step2 data={form} set={update} />}
              {step === 3 && <Step3 data={form} set={update} />}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-7 mb-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-[12px] font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="px-7 py-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60 dark:bg-gray-900/40">
              {step > 1 ? (
                <button type="button" onClick={() => { setError(""); setStep(s => s - 1); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 text-[13px] font-bold hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft size={15} /> Previous
                </button>
              ) : <div />}
              <button type="button" onClick={next} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-extrabold transition-all active:scale-[0.98] disabled:opacity-60 bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200 dark:shadow-orange-900/30">
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : step < 3 ? (
                  <>Next <ChevronRight size={15} /></>
                ) : (
                  <>Submit application <Check size={15} /></>
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
   TREE NODE COMPONENTS
 */

/* vertical connector line */
const VLine = ({ h = 28 }) => (
  <div className="flex justify-center">
    <div className="w-px bg-slate-200 dark:bg-gray-700" style={{ height: h }} />
  </div>
);

/* horizontal bridge between siblings */
const HBridge = () => (
  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full bg-slate-200 dark:bg-gray-700" />
);

/* ── root card ─── */
const RootCard = ({ person }) => (
  <div className="flex flex-col items-center">
    <div className="relative bg-white dark:bg-gray-900 border-2 border-orange-400 rounded-2xl px-6 py-4 text-center shadow-lg shadow-orange-100 dark:shadow-orange-900/20 hover:-translate-y-1 transition-transform cursor-default min-w-[170px]">
      <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center font-extrabold text-orange-600 dark:text-orange-400 text-[16px] mx-auto mb-3 ring-4 ring-orange-200 dark:ring-orange-800/40">
        {person.initials}
      </div>
      <p className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-tight">{person.name}</p>
      <p className="text-[12px] text-orange-500 font-semibold mt-0.5">{person.role}</p>
      <span className="mt-2 inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40">
        President
      </span>
    </div>
    <VLine h={32} />
  </div>
);

/* ── VP card  */
const VpCard = ({ person }) => (
  <div className="flex flex-col items-center flex-1 px-2">
    <VLine h={28} />
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default w-full max-w-[155px]">
      <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 text-[13px] mx-auto mb-2.5">
        {person.initials}
      </div>
      <p className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">{person.name}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{person.role}</p>
      <span className="mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
        VP
      </span>
    </div>
    <VLine h={28} />
  </div>
);

/* ── Lead card ─── */
const LeadCard = ({ person }) => (
  <div className="flex flex-col items-center flex-1 px-1.5">
    <VLine h={24} />
    <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-xl px-3 py-3 text-center hover:border-orange-200 dark:hover:border-orange-800/60 hover:-translate-y-0.5 transition-all cursor-default w-full max-w-[128px]">
      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center font-semibold text-slate-600 dark:text-slate-300 text-[12px] mx-auto mb-2">
        {person.initials}
      </div>
      <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{person.name}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{person.role}</p>
      <span className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400">
        Lead
      </span>
    </div>
    <VLine h={20} />
  </div>
);

/* ── Volunteer card  */
const VolCard = ({ person }) => (
  <div className="flex flex-col items-center flex-1 px-1">
    <VLine h={20} />
    <div className="bg-white dark:bg-gray-900 border border-dashed border-slate-200 dark:border-gray-700 rounded-xl px-2.5 py-2.5 text-center hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-default w-full max-w-[100px]">
      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] mx-auto mb-1.5">
        {person.initials}
      </div>
      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Volunteer</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{person.role}</p>
    </div>
  </div>
);

/* 
   MAIN PAGE
 */
export default function TeamVolunteers() {
  const [dialogOpen, setDialogOpen] = useState(false);

  /* group helpers */
  const vpLeads = (vpGroup) => TEAM.leads.filter(l => l.group === vpGroup);
  const leadVols = (leadRole) => TEAM.volunteers.filter(v => v.role.toLowerCase().includes(leadRole.toLowerCase().slice(0, 5)));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 pt-16 pb-20">
    <HeroHeader/>
      <div className="max-w-6xl mx-auto mt-20">

        {/* ── Page header ─ */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-orange-500 text-[12px] font-bold mb-6">
            <Sparkles size={12} />
            Meet the people behind the mission
          </div>
          <h1 className="text-[40px] md:text-[52px] font-extrabold text-slate-900 dark:text-white leading-[1.08] tracking-tight mb-4">
            Our{" "}
            <span className="relative">
              <span className="text-orange-500">team</span>
              <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" height="6" viewBox="0 0 80 6" preserveAspectRatio="none">
                <path d="M0 4 Q20 1 40 4 Q60 7 80 4" stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
              </svg>
            </span>
            {" "}&amp; volunteers
          </h1>
          <p className="text-[16px] text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            A passionate group of leaders and volunteers working together to build a stronger, more connected community.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              { icon: Users,   value: "23",   label: "Team members" },
              { icon: Heart,   value: "100%", label: "Volunteer driven" },
              { icon: Sparkles,value: "3",    label: "Departments" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 flex items-center justify-center">
                  <Icon size={14} className="text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TREE  */}
        <div className="overflow-x-auto pb-4">
          <div style={{ minWidth: 760 }}>

            {/* Tier 0 — President */}
            <RootCard person={TEAM.root} />

            {/* Tier 1 — VPs (horizontal bridge) */}
            <div className="relative flex justify-center">
              {/* horizontal bridge across VP tops */}
              <div className="absolute top-0 left-[calc(16.66%+30px)] right-[calc(16.66%+30px)] h-px bg-slate-200 dark:bg-gray-700 z-0" />
              {TEAM.vps.map(vp => <VpCard key={vp.id} person={vp} />)}
            </div>

            {/* Tier 2 — Leads (2 per VP, grouped) */}
            <div className="relative flex">
              {/* 3 horizontal bridges for each VP's pair of leads */}
              <div className="absolute top-0 left-[calc(8.33%+10px)] w-[calc(16.66%-20px)] h-px bg-slate-200 dark:bg-gray-700" />
              <div className="absolute top-0 left-[calc(41.66%-4px)] w-[calc(16.66%-8px)] h-px bg-slate-200 dark:bg-gray-700" />
              <div className="absolute top-0 left-[calc(74.99%-4px)] w-[calc(16.66%-4px)] h-px bg-slate-200 dark:bg-gray-700" />
              {TEAM.leads.map(l => <LeadCard key={l.id} person={l} />)}
            </div>

            {/* Tier 3 — Volunteers (2 per lead = 12 total) */}
            <div className="relative flex">
              {/* bridge bars across each lead's 2 volunteers */}
              {[0,1,2,3,4,5].map(i => (
                <div key={i}
                  className="absolute top-0 h-px bg-slate-200 dark:bg-gray-700"
                  style={{ left: `calc(${(i*2+0.5)*8.33}% + 0px)`, width: `calc(8.33% - 4px)` }}
                />
              ))}
              {TEAM.volunteers.map(v => <VolCard key={v.id} person={v} />)}
            </div>

          </div>
        </div>

        {/* ── Legend  */}
        <div className="flex flex-wrap justify-center gap-5 mt-10 pt-8 border-t border-slate-100 dark:border-gray-800">
          {[
            { color: "bg-orange-400", label: "President", border: "border-orange-300" },
            { color: "bg-amber-400",  label: "Vice Presidents", border: "border-amber-300" },
            { color: "bg-slate-300",  label: "Team Leads", border: "border-slate-200" },
            { color: "bg-emerald-400",label: "Volunteers", border: "border-emerald-300" },
          ].map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Become a volunteer CTA  */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7 rounded-3xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30">
          <div>
            <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-1">Want to join the team?</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-sm">
              We're always looking for passionate volunteers. Apply in under 3 minutes — no experience needed.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[14px] font-extrabold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Heart size={16} className="fill-white" />
            Become a volunteer
            <ChevronRight size={15} />
          </button>
        </div>

      </div>

      {/* Dialog */}
      {dialogOpen && <VolunteerDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}