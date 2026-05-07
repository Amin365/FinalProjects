import React from "react";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import api from "../../app/api/apislice";
import {
  User, Mail, Phone, GraduationCap, BookOpen,
  Heart, Check, ChevronLeft, ChevronRight,
  X, Loader2, Sparkles, Building2, Users,
} from "lucide-react";

/* 
   CONSTANTS
 */
const STEPS = [
  { id: 1, label: "Personal",   icon: User         },
  { id: 2, label: "Education",  icon: GraduationCap },
  { id: 3, label: "Motivation", icon: Heart         },
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

const TEACH_AREAS = [
  "Programming & web development",
  "Data science & AI",
  "Digital marketing",
  "Design & UX",
  "Business & entrepreneurship",
  "Reading & communication",
  "Other",
];

const AVAILABILITY = [
  "Weekday mornings",
  "Weekday evenings",
  "Weekends",
  "Fully flexible",
];

/* 
   SMALL HELPERS
 */
const inputCls =
  "w-full px-4 py-3 rounded-xl text-[13.5px] bg-slate-50 dark:bg-gray-800 " +
  "border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-100 " +
  "placeholder:text-slate-300 dark:placeholder:text-gray-600 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-800/50 " +
  "focus:border-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const FL = ({ children, req }) => (
  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}{req && <span className="text-orange-500 ml-0.5">*</span>}
  </label>
);

const FieldBox = ({ label, req, children }) => (
  <div className="flex flex-col">
    <FL req={req}>{label}</FL>
    {children}
  </div>
);

/*  Step 1: Personal Info ─ */
const Step1 = ({ data, set, disabled }) => (
  <div className="flex flex-col gap-4">
    <FieldBox label="Full name" req>
      <div className="relative">
        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="e.g. Amara Diallo"
          value={data.FullName}
          onChange={e => set("FullName", e.target.value)}
          disabled={disabled}
        />
      </div>
    </FieldBox>

    <FieldBox label="Email address" req>
      <div className="relative">
        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`${inputCls} pl-9`}
          type="email"
          placeholder="your@email.com"
          value={data.email}
          onChange={e => set("email", e.target.value)}
          disabled={disabled}
        />
      </div>
    </FieldBox>

    <FieldBox label="Phone number" req>
      <div className="relative">
        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`${inputCls} pl-9`}
          type="tel"
          placeholder="+251 9 XX XXX XXXX"
          value={data.phone}
          onChange={e => set("phone", e.target.value)}
          disabled={disabled}
        />
      </div>
    </FieldBox>
  </div>
);

/*  Step 2: Education Background ─ */
const Step2 = ({ data, set }) => (
  <div className="flex flex-col gap-5">
    <FieldBox label="Highest education level" req>
      <div className="grid grid-cols-1 gap-2">
        {EDUCATION_LEVELS.map(lvl => {
          const active = data.education_level === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => set("education_level", lvl)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[13px] font-medium transition-all
                ${active
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-2 ring-orange-100 dark:ring-orange-900/30"
                  : "border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-orange-200 hover:bg-orange-50/50 dark:hover:bg-orange-900/10"
                }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                ${active ? "border-orange-500 bg-orange-500" : "border-slate-300 dark:border-gray-600"}`}>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              {lvl}
            </button>
          );
        })}
      </div>
    </FieldBox>

    <FieldBox label="Institution / School name" req>
      <div className="relative">
        <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="e.g. Jimma University"
          value={data.institution}
          onChange={e => set("institution", e.target.value)}
        />
      </div>
    </FieldBox>
  </div>
);

/*  Step 3: Motivation & Readiness ─ */
const Step3 = ({ data, set }) => {
  const toggleArea = (area) => {
    const arr = data.teachAreas || [];
    set("teachAreas", arr.includes(area) ? arr.filter(a => a !== area) : [...arr, area]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Ready to teach toggle */}
      <FieldBox label="Are you ready to teach young generations?" req>
        <div className="flex gap-3">
          {[{ v: true, l: "Yes, I'm ready!" }, { v: false, l: "Not yet, but learning" }].map(({ v, l }) => {
            const active = data.readyToTeach === v;
            return (
              <button key={String(v)} type="button" onClick={() => set("readyToTeach", v)}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-bold transition-all
                  ${active
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 ring-2 ring-orange-100 dark:ring-orange-900/30"
                    : "border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-orange-200"
                  }`}>
                {l}
              </button>
            );
          })}
        </div>
      </FieldBox>

      {/* Teaching areas */}
      <FieldBox label="What would you like to teach?" req>
        <div className="grid grid-cols-2 gap-2">
          {TEACH_AREAS.map(area => {
            const active = (data.teachAreas || []).includes(area);
            return (
              <button key={area} type="button" onClick={() => toggleArea(area)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12.5px] font-medium text-left transition-all
                  ${active
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                    : "border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-orange-200 hover:bg-orange-50/40 dark:hover:bg-orange-900/10"
                  }`}>
                <span className={`w-3.5 h-3.5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all
                  ${active ? "border-orange-500 bg-orange-500" : "border-slate-300 dark:border-gray-600"}`}>
                  {active && <Check size={9} className="text-white" strokeWidth={3} />}
                </span>
                <span className="leading-tight">{area}</span>
              </button>
            );
          })}
        </div>
      </FieldBox>

      {/* Availability */}
      <FieldBox label="Your availability">
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY.map(a => {
            const active = data.availability === a;
            return (
              <button key={a} type="button" onClick={() => set("availability", a)}
                className={`px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-all
                  ${active
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                    : "border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:border-orange-200"
                  }`}>
                {a}
              </button>
            );
          })}
        </div>
      </FieldBox>

      {/* Motivation text */}
      <FieldBox label="Why do you want to volunteer?" req>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Tell us what drives you to help young learners…"
          value={data.motivation}
          onChange={e => set("motivation", e.target.value)}
        />
      </FieldBox>
    </div>
  );
};

/* 
   SUCCESS SCREEN
 */
const SuccessScreen = ({ name }) => (
  <div className="flex flex-col items-center py-10 px-6 text-center gap-5">
    <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-200 dark:shadow-orange-900/30">
      <Check size={36} className="text-white" strokeWidth={3} />
    </div>
    <div>
      <h3 className="text-[22px] font-extrabold text-slate-900 dark:text-white mb-2">
        Request sent! 🎉
      </h3>
      <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
        Thank you, <span className="font-bold text-slate-800 dark:text-slate-200">{name?.split(" ")[0] || "friend"}</span>!
        Our team will review your application and contact you within{" "}
        <span className="font-bold text-orange-500">24 hours</span>.
      </p>
    </div>
    <div className="w-full rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
        <BookOpen size={16} className="text-white" />
      </div>
      <p className="text-[13px] text-slate-600 dark:text-slate-300 text-left leading-relaxed">
        <span className="font-bold">Keep reading. Keep growing.</span><br />
        <span className="text-slate-400 text-[12px]">This window will close automatically…</span>
      </p>
    </div>
  </div>
);

/* 
   MAIN COMPONENT
 */
const EMPTY = {
  FullName: "", phone: "", email: "",
  education_level: "", institution: "",
  readyToTeach: null, teachAreas: [], availability: "", motivation: "",
  status: "Pending",
};

const JoinClub = ({ open, onOpenChange, onSuccess }) => {
  const [step,        setStep]        = React.useState(1);
  const [form,        setForm]        = React.useState(EMPTY);
  const [success,     setSuccess]     = React.useState(false);
  const [emailExists, setEmailExists] = React.useState(false);
  const [error,       setError]       = React.useState("");

  /* check localStorage for duplicate email */
  React.useEffect(() => {
    if (form.email) {
      const emails = JSON.parse(localStorage.getItem("joinedClubEmails") || "[]");
      setEmailExists(emails.includes(form.email));
    } else {
      setEmailExists(false);
    }
  }, [form.email]);

  /* reset when dialog opens */
  React.useEffect(() => {
    if (open) { setStep(1); setForm(EMPTY); setSuccess(false); setError(""); }
  }, [open]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  /* validation per step */
  const validate = () => {
    if (step === 1) {
      if (!form.FullName.trim()) return "Full name is required.";
      if (!form.email.trim())   return "Email address is required.";
      if (!form.phone.trim())   return "Phone number is required.";
      if (emailExists)          return "You already submitted a request with this email.";
    }
    if (step === 2) {
      if (!form.education_level) return "Please select your education level.";
      if (!form.institution.trim()) return "Institution name is required.";
    }
    if (step === 3) {
      if (form.readyToTeach === null)           return "Please tell us if you're ready to teach.";
      if (!form.teachAreas.length)              return "Please select at least one area to teach.";
      if (!form.motivation.trim())              return "Please share your motivation.";
    }
    return "";
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/join-club", data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      const emails = JSON.parse(localStorage.getItem("joinedClubEmails") || "[]");
      localStorage.setItem("joinedClubEmails", JSON.stringify([...emails, vars.email]));
      onSuccess?.();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setForm(EMPTY); onOpenChange(false); }, 4000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    },
  });

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (step < 3) { setStep(s => s + 1); }
    else { mutation.mutate(form); }
  };

  const prev = () => { setError(""); setStep(s => Math.max(1, s - 1)); };

  const progress = Math.round(((step - 1) / 2) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden rounded-[28px] border-0 shadow-2xl w-full max-w-lg bg-white dark:bg-gray-900 [&>button]:hidden">
        {success ? (
          <SuccessScreen name={form.FullName} />
        ) : (
          <>
            {/*  Dialog header ─ */}
            <div className="px-7 pt-7 pb-0">
              {/* top row */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
                    <Users size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Volunteer application</p>
                    <h2 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight">Join degahbur public Library</h2>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-0 mb-1">
                {STEPS.map((s, i) => {
                  const done   = step > s.id;
                  const active = step === s.id;
                  const Icon   = s.icon;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                          ${done   ? "border-orange-500 bg-orange-500 text-white"
                            : active ? "border-orange-500 bg-white dark:bg-gray-900 text-orange-500 shadow-md shadow-orange-100 dark:shadow-orange-900/20"
                            : "border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-400"}`}>
                          {done ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
                        </div>
                        <span className={`text-[10px] font-bold whitespace-nowrap hidden sm:block
                          ${active ? "text-orange-500" : done ? "text-slate-500" : "text-slate-300 dark:text-slate-600"}`}>
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
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

              {/* Step title */}
              <div className="flex items-center justify-between mt-3 mb-5">
                <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                  {step === 1 ? "Personal information" : step === 2 ? "Education background" : "Motivation & readiness"}
                </h3>
                <span className="text-[11.5px] text-slate-400 font-semibold">Step {step} of 3</span>
              </div>
            </div>

            {/*  Scrollable body ─ */}
            <div className="px-7 pb-2 overflow-y-auto max-h-[55vh]">
              {/* Duplicate email warning */}
              {emailExists && step === 1 && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-[12.5px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <X size={13} className="shrink-0" />
                  You already submitted a request with this email address.
                </div>
              )}

              {/* 24h notice */}
              {step === 1 && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 text-[12.5px] text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <Sparkles size={13} className="shrink-0 text-orange-500" />
                  Our team will contact you within <strong className="ml-1">24 hours</strong> of submitting.
                </div>
              )}

              {step === 1 && <Step1 data={form} set={set} disabled={emailExists} />}
              {step === 2 && <Step2 data={form} set={set} />}
              {step === 3 && <Step3 data={form} set={set} />}
            </div>

            {/*  Error  */}
            {error && (
              <div className="mx-7 mb-1 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-[12px] font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/*  Footer nav ─ */}
            <div className="px-7 py-5 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-gray-900/40">
              {step > 1 ? (
                <button type="button" onClick={prev}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors">
                  <ChevronLeft size={15} /> Previous
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={next}
                disabled={mutation.isPending || (step === 1 && emailExists)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[13px] font-extrabold bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                ) : step < 3 ? (
                  <>Next <ChevronRight size={15} /></>
                ) : (
                  <>Submit application <Check size={14} /></>
                )}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JoinClub;
