import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  Users,
  Calendar,
  Clock,
  Loader2,
  X,
  ShieldCheck,
  Clipboard,
  Mail,
  Phone,
  Archive,
  BookOpen,
  FileText,
  StickyNote,
  Plus,
  AlertTriangle,
  CheckCircle,
  Flame,
} from "lucide-react";
import MemberDetailsSkeleton from "./MemberDetialsskleton";

/* Local Card wrapper (matching the visual style used previously) */
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-sm border border-slate-200/80 bg-white/90 backdrop-blur-sm dark:bg-gray-800/80 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);

/* Small badge used for status */
const Badge = ({ status }) => {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    Inactive: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    Archived: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide uppercase ${
        styles[status] || "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/40 dark:text-gray-200"
      }`}
    >
      {status}
    </span>
  );
};

/* small pill helper */
const Pill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 dark:bg-gray-700/40 dark:text-gray-200 dark:border-gray-600">
    {Icon && <Icon size={13} />} {label}
  </span>
);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

export default function MemberDetails() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    type: "",
    title: "",
    message: "",
    btnText: "",
    action: () => {},
  });
  const [isOperationLoading, setIsOperationLoading] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Notes form state
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState("");

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Fetch member
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["member", routeId],
    queryFn: async () => {
      const res = await api.get(`/members/${routeId}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(routeId),
    staleTime: 30_000,
  });

  const member = data ?? null;

  

  // Fetch member overview (issues, daily reports, notes, moderator)
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["member-overview", routeId],
    queryFn: async () => {
      const res = await api.get(`/members/${routeId}/overview`);
      return res.data?.data;
    },
    enabled: Boolean(routeId),
    staleTime: 60_000,
  });

  // Notes mutations
  const addNoteMutation = useMutation({
    mutationFn: async ({ note, category }) => {
      const res = await api.post(`/members/${routeId}/notes`, { note, category });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Note added");
      setNoteText("");
      setNoteCategory("");
      qc.invalidateQueries({ queryKey: ["member-overview", routeId] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to add note"),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const res = await api.delete(`/members/${routeId}/notes/${noteId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Note removed");
      qc.invalidateQueries({ queryKey: ["member-overview", routeId] });
    },
    onError: () => toast.error("Failed to remove note"),
  });
  const archiveMutation = useMutation({
    mutationFn: async (memberId) => {
      const res = await api.post(`/members/${memberId}/archive`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Member archived");
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["member", routeId] });
    },
    onError: () => {
      toast.error("Archive failed");
    },
    onSettled: () => setIsOperationLoading(false),
  });

  const restoreMutation = useMutation({
    mutationFn: async (memberId) => {
      const res = await api.post(`/members/${memberId}/restore`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Member restored");
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["member", routeId] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Restore failed");
    },
    onSettled: () => setIsOperationLoading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId) => {
      const res = await api.delete(`/members/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Member deleted");
      qc.invalidateQueries({ queryKey: ["members"] });
      navigate(-1);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Delete failed");
    },
    onSettled: () => setIsOperationLoading(false),
  });

  // Mutation to send email via backend endpoint
 const sendEmailMutation = useMutation({
  mutationFn: async (payload) => {
    const res = await api.post(`/members/${routeId}/send-email`, payload);
    return res.data;
  },
  onMutate: () => {
    toast("Sending email...");
  },
  onSuccess: () => {
    toast.success("Email queued successfully");
    setIsEmailModalOpen(false);
  },
  onError: (err) => {
    const msg = err?.response?.data?.message || err?.message || "Failed to send email";
    toast.error(msg);
  },
});


  const handleEdit = () => {
    if (!member?._id && !member?.id) return;
    navigate(`/dashboard/members/edit/${member._id ?? member.id}`);
  };

  // Clipboard helper
  const copyToClipboard = async (text, label = "Value") => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleArchiveRestoreToggle = () => {
    if (!member) return;
    if (member.isArchived || member.is_record_archived || member.isRecordArchived) {
      setDialogConfig({
        type: "restore",
        title: "Restore Member",
        message: "Are you sure you want to restore this member? They will appear again in active lists.",
        btnText: "Restore Member",
        action: async () => {
          try {
            setIsOperationLoading(true);
            await restoreMutation.mutateAsync(routeId);
          } finally {
            setIsDialogOpen(false);
          }
        },
      });
    } else {
      setDialogConfig({
        type: "archive",
        title: "Archive Member",
        message: "Are you sure you want to archive this member? They will be hidden from active lists but can be restored later.",
        btnText: "Archive Member",
        action: async () => {
          try {
            setIsOperationLoading(true);
            await archiveMutation.mutateAsync(routeId);
          } finally {
            setIsDialogOpen(false);
          }
        },
      });
    }
    setIsDialogOpen(true);
  };

  const handleDeleteCheck = () => {
    if (!member) return;

    if (!(member.isArchived || member.is_record_archived || member.isRecordArchived)) {
      setDialogConfig({
        type: "warning_archive",
        title: "Cannot Delete Active Member",
        message: "Safety Protocol: You must archive this member before permanently deleting. Would you like to archive them now?",
        btnText: "Yes, Archive Member",
        action: async () => {
          try {
            setIsOperationLoading(true);
            await archiveMutation.mutateAsync(routeId);
          } finally {
            setIsDialogOpen(false);
          }
        },
      });
      setIsDialogOpen(true);
      return;
    }

    setDialogConfig({
      type: "danger",
      title: "Permanently Delete Member",
      message: "WARNING: This action cannot be undone. All data associated with this member will be permanently removed.",
      btnText: "Delete Permanently",
      action: async () => {
        try {
          setIsOperationLoading(true);
          await deleteMutation.mutateAsync(routeId);
        } finally {
          setIsDialogOpen(false);
        }
      },
    });

    setIsDialogOpen(true);
  };

  const openEmailModal = (e) => {
    e && e.stopPropagation();
    if (!member?.email) {
      toast.error("Member has no email on record");
      return;
    }

    setEmailBody("");
    setIsEmailModalOpen(true);
  };

 const submitEmail = async () => {
  if (!member?.email) {
    toast.error("Member has no email");
    return;
  }
  if (!emailSubject.trim() && !emailBody.trim()) {
    toast.error("Enter a subject or message");
    return;
  }

  sendEmailMutation.mutate({
    subject: emailSubject,
    text: emailBody,
    html: emailBody ? `<p>${emailBody.replace(/\n/g, "<br/>")}</p>` : undefined,
  });
};

  if (isLoading) {
    return <MemberDetailsSkeleton />;
  }

  if (isError || !member) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        Error: {error?.response?.data?.message || error?.message || "Member not found"}
      </div>
    );
  }

  const location = member.region || "Region N/A";

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300 pb-14 relative px-2 sm:px-0">
      {/* Top header row */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors dark:hover:bg-gray-700/60 dark:hover:border-gray-600"
          aria-label="Back"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-gray-200" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 tracking-tight">
              Member Profile
            </h1>

            {(member.isArchived || member.isRecordArchived) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide dark:bg-amber-900/30 dark:text-amber-300">
                <ShieldCheck size={12} /> Archived
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Code: <span className="font-semibold text-slate-700 dark:text-gray-100">{member.code || "—"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(member._id ?? member.id, "Member ID"); }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border rounded-md hover:bg-slate-100 dark:bg-gray-700/40 dark:border-gray-600 dark:hover:bg-gray-700/30"
                title="Copy Member ID"
              >
                <Clipboard size={14} /> Copy ID
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={openEmailModal}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-white/80 text-slate-700 rounded-xl flex items-center gap-2 text-xs md:text-sm font-medium border border-slate-200 hover:bg-slate-50 dark:bg-gray-800/70 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700/60"
            title="Send email"
          >
            <Mail size={16} /> {member.email ? "Send Email" : "No email"}
          </button>

          <button
            onClick={handleDeleteCheck}
            disabled={isOperationLoading}
            className="px-3 py-1.5 md:px-4 md:py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 border border-red-100 dark:hover:bg-red-900/30 dark:border-red-800"
          >
            <Trash2 size={16} /> Delete
          </button>

          <button
            onClick={handleEdit}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl flex items-center gap-2 text-xs md:text-sm font-semibold shadow-md transition-colors"
          >
            <Edit2 size={16} /> Edit
          </button>
        </div>
      </div>

      {/* Redesigned Profile Header Card */}
      <Card className="mb-6 relative overflow-hidden border-0 ring-1 ring-slate-200 dark:ring-gray-700">
        <div className="h-32 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-700 dark:from-orange-600 dark:to-orange-800" />
        <div className="px-6 md:px-8 pb-7">
          <div className="flex flex-col md:flex-row items-start md:items-center -mt-12 gap-5 md:gap-6">
            {/* Avatar */}
            <div
              className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-3xl md:text-4xl font-bold text-white ${member.isArchived ? "bg-gray-400 dark:bg-gray-600" : "bg-slate-700 dark:bg-slate-600"}`}
              aria-hidden
            >
              {member.Profile_picture ? (
                <img
                  src={member.Profile_picture}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase()
              )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0 mt-15">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 truncate">
                    {member.first_name} {member.middle_name ? `${member.middle_name} ` : ""}{member.last_name}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    {member.department && (
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-50 text-slate-700 border dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-600">
                        <strong className="text-xs">Dept:</strong> {member.department}
                      </span>
                    )}

                    {member.study_year && (
                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-50 text-slate-700 border dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-600">
                        <strong className="text-xs">Year:</strong> {member.study_year}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Role: {member?.role?.role || "Null"}
                    </span>
                  </div>
                </div>

                {/* Right-side compact actions */}
                <div className="flex flex-col items-stretch gap-2">
                  <button
                    onClick={handleArchiveRestoreToggle}
                    disabled={isOperationLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-medium transition-colors disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700/40"
                  >
                    {isOperationLoading ? <Loader2 size={16} className="animate-spin" /> : (member.isArchived || member.isRecordArchived ? <><Archive size={16} /> Restore</> : <><Archive size={16} /> Archive</>)}
                  </button>
                </div>
              </div>

              {/* secondary row: code & copy */}
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Users size={20} className="text-orange-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 text-sm">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.first_name} {member.middle_name} {member.last_name}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Gender</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.gender || "N/A"}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Member Code</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-slate-800 dark:text-gray-100 font-medium">{member.code}</p>
                  <button
                    onClick={() => copyToClipboard(member.code, "Member Code")}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border rounded-md hover:bg-slate-100 dark:bg-gray-700/40 dark:border-gray-600 dark:hover:bg-gray-700/30"
                  >
                    <Clipboard size={14} /> Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Emergency Contact</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.emergency_contact || "N/A"}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Date of Birth</label>
                <div className="flex items-center gap-2 mt-1 text-slate-800 dark:text-gray-100 font-medium">
                  <Calendar size={16} /> {formatDate(member.date_of_birth)}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Region</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.region || "N/A"}</p>
              </div>
            </div>
          </Card>

          {/* Membership & Education */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-orange-500" /> Membership & Education
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 text-sm">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Join Date</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{formatDate(member.join_date)}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Department</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.department || "N/A"}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Student / Member ID</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.student_id || "N/A"}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Study Year</label>
                <p className="text-slate-800 dark:text-gray-100 font-medium mt-1">{member.study_year ? `${member.study_year}${member.study_year === "1" ? "st" : member.study_year === "2" ? "nd" : member.study_year === "3" ? "rd" : "th"} year` : "N/A"}</p>
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Notes</label>
                <p className="text-slate-700 dark:text-gray-200 mt-1">{member.notes || "No notes provided."}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact */}
          <Card className="p-6">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-4">Contact Methods</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 dark:hover:bg-gray-700/30 dark:hover:border-gray-600">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 dark:bg-orange-900/20 dark:text-orange-300">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-gray-100">{member.email || "No email set"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Official Email</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 dark:hover:bg-gray-700/30 dark:hover:border-gray-600">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-gray-100">{member.phone || "No phone set"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Primary Phone</p>
                </div>
                {member.phone && (
                  <div className="ml-auto flex gap-2">
                    <a href={`tel:${member.phone}`} className="text-xs px-2 py-1 rounded-md border bg-white dark:bg-gray-800/60">Call</a>
                    <button onClick={() => copyToClipboard(member.phone, "Phone")} className="text-xs px-2 py-1 rounded-md border bg-white dark:bg-gray-800/60 inline-flex items-center gap-1"><Clipboard size={14} />Copy</button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800 dark:text-gray-100">
                <Clock size={16} /> Metadata
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-wider">Created</label>
                <div className="font-mono mt-1 text-slate-800 dark:text-gray-100">{formatDate(member.createdAt)}</div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-wider">Last Updated</label>
                <div className="font-mono mt-1 text-slate-800 dark:text-gray-100">{formatDate(member.updatedAt)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Timeline Tabs */}
      <div className="mt-8">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-gray-700 mb-6">
          {[
            { id: "profile", label: "Profile", icon: Users },
            { id: "issues", label: "Issue History", icon: BookOpen }
          
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-gray-200"
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Issues tab */}
        {activeTab === "issues" && (
          <div>
            {overviewLoading && <p className="text-sm text-slate-400 py-6 text-center">Loading…</p>}
            {!overviewLoading && overviewData && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-bold dark:text-white">{overviewData.issues?.total ?? 0}</p>
                    <p className="text-xs text-slate-500">Total Issued</p>
                  </div>
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overviewData.issues?.overdueCount ?? 0}</p>
                    <p className="text-xs text-red-500">Overdue</p>
                  </div>
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overviewData.issues?.returnedCount ?? 0}</p>
                    <p className="text-xs text-green-500">Returned</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(overviewData.issues?.list ?? []).map((issue) => (
                    <div key={issue._id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-gray-700 p-3 text-sm">
                      <div>
                        <p className="font-medium dark:text-white">{issue.book?.title || "Unknown Book"}</p>
                        <p className="text-xs text-slate-500">{issue.book?.author} · Issued {formatDate(issue.issueDate)}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        issue.status === "Overdue" ? "bg-red-100 text-red-700" : issue.status === "Returned" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {issue.status}
                      </span>
                    </div>
                  ))}
                  {(overviewData.issues?.list ?? []).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">No issue history.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Daily Reports tab */}
        {/* {activeTab === "reports" && (
          <div>
            {overviewLoading && <p className="text-sm text-slate-400 py-6 text-center">Loading…</p>}
            {!overviewLoading && overviewData && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-2xl font-bold dark:text-white">{overviewData.dailyReports?.total ?? 0}</p>
                    <p className="text-xs text-slate-500">Total Reports</p>
                  </div>
                  <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4 text-center flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1">
                      <Flame size={18} className="text-orange-500" />
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{overviewData.dailyReports?.streak ?? 0}</p>
                    </div>
                    <p className="text-xs text-orange-500">Day Streak</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(overviewData.dailyReports?.list ?? []).map((report) => (
                    <div key={report._id} className="rounded-xl border border-slate-100 dark:border-gray-700 p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium dark:text-white">{report.book?.title || "Unknown Book"}</p>
                        <span className="text-xs text-slate-500">{formatDate(report.readingDate)}</span>
                      </div>
                      <p className="text-xs text-slate-500">Pages {report.pagesFrom}–{report.pagesTo} · {report.timeSpent} min</p>
                      {report.summary && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{report.summary}"</p>}
                    </div>
                  ))}
                  {(overviewData.dailyReports?.list ?? []).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">No daily reports.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )} */}

        {/* Notes tab */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            {/* Add note form */}
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              <h4 className="text-sm font-semibold mb-3 dark:text-white">Add Internal Note</h4>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
                placeholder="Write a note about this member..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Category / tag (optional)"
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                />
                <button
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                  onClick={() => addNoteMutation.mutate({ note: noteText, category: noteCategory })}
                  className="flex items-center gap-1 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Notes list */}
            {overviewLoading && <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>}
            {!overviewLoading && (
              <div className="space-y-2">
                {(overviewData?.notes ?? []).map((note) => (
                  <div key={note._id} className="rounded-xl border border-slate-100 dark:border-gray-700 p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="dark:text-white">{note.note}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          {note.category && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300">
                              {note.category}
                            </span>
                          )}
                          <span>{note.author ? `${note.author.first_name || ""} ${note.author.last_name || ""}`.trim() || note.author.username : "Unknown"}</span>
                          <span>·</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNoteMutation.mutate(note._id)}
                        disabled={deleteNoteMutation.isPending}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remove note"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(overviewData?.notes ?? []).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">No notes yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog (simple centered modal) */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-slate-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-base md:text-lg font-bold ${dialogConfig.type === "danger" ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-gray-100"}`}>
                  {dialogConfig.title}
                </h3>
                <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white" aria-label="Close dialog">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{dialogConfig.message}</p>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 dark:text-slate-200 dark:hover:bg-gray-700/30">
                  Cancel
                </button>

                <button
                  onClick={dialogConfig.action}
                  disabled={isOperationLoading}
                  className={`px-4 py-2 text-xs text-white rounded-xl font-medium flex items-center gap-2 ${dialogConfig.type === "danger" ? "bg-red-600 hover:bg-red-700" : dialogConfig.type === "warning_archive" ? "bg-amber-500 hover:bg-amber-600" : "bg-orange-600 hover:bg-orange-700"}`}
                >
                  {isOperationLoading ? <Loader2 size={16} className="animate-spin" /> : dialogConfig.btnText || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-slate-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Send Email to {member.first_name} {member.last_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recipient: <span className="font-mono">{member.email}</span></p>
                </div>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white" aria-label="Close email dialog">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-200">Subject</label>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-900/70 dark:text-gray-100"
                  placeholder="Email subject"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-200">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  className="w-full mt-2 px-3 py-2 rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-900/70 dark:text-gray-100"
                  placeholder="Write your message here..."
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 rounded-md border bg-white dark:bg-gray-800/70">Cancel</button>
                <button
                  onClick={submitEmail}
                  disabled={sendEmailMutation?.isLoading}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white flex items-center gap-2"
                >
                  {sendEmailMutation?.isLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Send</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}