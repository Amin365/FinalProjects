import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  Target,
  User,
  Briefcase,
  BookMarked,
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-sm border border-slate-200/80 bg-white/90 ${className}`}>
    {children}
  </div>
);

const Pill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
    {Icon && <Icon size={13} />} {label}
  </span>
);

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">{label}</p>
    <p className="mt-1 text-slate-700">{value || "N/A"}</p>
  </div>
);

export default function EnrollmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const res = await api.get(`/enrollments/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const enrollment = data || null;
  const form = enrollment?.formData || {};
  const learner = typeof enrollment?.userId === "object" ? enrollment.userId : null;
  const program = typeof enrollment?.programId === "object" ? enrollment.programId : null;

  const fullName = useMemo(() => {
    const formName = [form.firstName, form.lastName].filter(Boolean).join(" ").trim();
    const userName = [learner?.first_name, learner?.last_name].filter(Boolean).join(" ").trim();
    return formName || userName || "Unknown learner";
  }, [form.firstName, form.lastName, learner?.first_name, learner?.last_name]);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "education", label: "Education", icon: BookMarked },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "goals", label: "Goals", icon: Target },
  ];

  if (isLoading) {
    return <div className="p-6 text-slate-400">Loading enrollment details...</div>;
  }

  if (isError || !enrollment) {
    return <div className="p-6 text-red-500">Failed to load enrollment details.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Enrollment Details</p>
                <h1 className="mt-2 text-3xl font-extrabold">{fullName}</h1>
                <p className="mt-2 text-sm text-white/80">
                  {program?.title || "Program"} · submitted on {formatDate(enrollment.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill icon={CheckCircle2} label={enrollment.status} />
                <Pill icon={BookOpen} label={program?.title || "Program"} />
                <Pill icon={Clock} label={formatDate(enrollment.createdAt)} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-5">
              <Card className="p-5">
                <div className="mb-4 flex gap-2 border-b border-slate-100 pb-3">
                  {tabs.map(({ id: tabId, label, icon: Icon }) => (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setActiveTab(tabId)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        activeTab === tabId
                          ? "bg-orange-50 text-orange-600"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                {activeTab === "profile" && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="First Name" value={form.firstName || learner?.first_name} />
                    <Field label="Last Name" value={form.lastName || learner?.last_name} />
                    <Field label="Email" value={form.email || learner?.email} />
                    <Field label="Phone" value={form.phone || learner?.phone} />
                    <Field label="Country" value={form.country} />
                    <Field label="Date of Birth" value={form.dob} />
                    <Field label="Gender" value={form.gender} />
                  </div>
                )}

                {activeTab === "education" && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Education Level" value={form.educationLevel} />
                    <Field label="Field of Study" value={form.fieldOfStudy} />
                    <Field label="Institution" value={form.institution} />
                    <Field label="Graduation Year" value={form.gradYear} />
                    <Field label="GPA / Grade" value={form.gpa} />
                  </div>
                )}

                {activeTab === "experience" && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Experience Level" value={form.experienceLevel} />
                    <Field label="Job Title" value={form.jobTitle} />
                    <Field label="Company" value={form.company} />
                    <Field label="Existing Skills" value={form.existingSkills} />
                  </div>
                )}

                {activeTab === "goals" && (
                  <div className="space-y-5">
                    <Field label="Motivations" value={Array.isArray(form.motivations) ? form.motivations.join(", ") : ""} />
                    <Field label="Hours Per Week" value={form.hoursPerWeek} />
                    <Field label="Learning Style" value={form.learningStyle} />
                    <Field label="Notes" value={form.notes} />
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="p-5">
                <h2 className="text-lg font-bold text-slate-900">Program Info</h2>
                <div className="mt-4 space-y-4">
                  <Field label="Program" value={program?.title} />
                  <Field label="Teacher" value={program?.teacherId} />
                  <Field label="Capacity" value={program?.capacity} />
                  <Field label="Start Date" value={formatDate(program?.startDate)} />
                  <Field label="End Date" value={formatDate(program?.endDate)} />
                  <Field label="Status" value={program?.status} />
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-bold text-slate-900">Quick Contact</h2>
                <div className="mt-4 space-y-3">
                  <Pill icon={Mail} label={form.email || learner?.email || "No email"} />
                  <Pill icon={Phone} label={form.phone || "No phone"} />
                  <Pill icon={MapPin} label={form.country || "No country"} />
                  <Pill icon={Calendar} label={formatDate(enrollment.createdAt)} />
                  <Pill icon={GraduationCap} label={program?.teacherId || "Instructor"} />
                  <Pill icon={StickyNote} label={enrollment.note || "No admin note"} />
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
