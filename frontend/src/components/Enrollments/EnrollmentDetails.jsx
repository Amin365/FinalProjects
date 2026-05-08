import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clipboard,
  Download,
  FileText,
  Loader2,
  Mail,
  Phone,
  Trash2,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import { cn } from "@/lib/utils";
import MemberDetailsSkeleton from "@/components/Members/MemberDetialsskleton";

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-sm border border-slate-200/80 bg-white/90 backdrop-blur-sm dark:bg-gray-800/80 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  waitlisted: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-700/40 dark:text-gray-200 dark:border-gray-600",
};

const STATUS_ICONS = {
  pending: AlertTriangle,
  confirmed: CheckCircle,
  waitlisted: Users,
  rejected: XCircle,
  cancelled: X,
};

const Badge = ({ status }) => {
  const normalized = String(status || "pending").toLowerCase();
  const Icon = STATUS_ICONS[normalized] || AlertTriangle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide uppercase",
        STATUS_STYLES[normalized] || STATUS_STYLES.pending
      )}
    >
      <Icon size={12} /> {normalized}
    </span>
  );
};

const InfoItem = ({ label, value, action }) => (
  <div>
    <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
      {label}
    </label>
    <div className="mt-1 flex items-center gap-2">
      <p className="min-w-0 break-words text-slate-800 dark:text-gray-100 font-medium">
        {value === null || value === undefined || value === "" ? "N/A" : value}
      </p>
      {action}
    </div>
  </div>
);

const formatDate = (date) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const formatDateTime = (date) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
};

const formatBytes = (bytes) => {
  if (!bytes) return "N/A";
  const mb = Number(bytes) / 1024 / 1024;
  return mb < 1 ? `${(Number(bytes) / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
};

const getUserName = (user, formData = {}) => {
  if (typeof user === "object" && user) {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  }
  return `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EN";

const humanizeKey = (key = "") =>
  String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function EnrollmentDetails() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["enrollment", routeId],
    queryFn: async () => {
      const res = await api.get(`/enrollments/${routeId}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(routeId),
    staleTime: 30_000,
  });

  const enrollment = data ?? null;
  const formData = enrollment?.formData || {};
  const user = typeof enrollment?.userId === "object" ? enrollment.userId : null;
  const program = typeof enrollment?.programId === "object" ? enrollment.programId : null;
  const learnerName = getUserName(user, formData) || "Unknown learner";
  const learnerEmail = user?.email || formData.email || (typeof enrollment?.userId === "string" ? enrollment.userId : "");
  const learnerPhone = user?.phone || formData.phone || "";
  const profilePicture = user?.profile_picture || user?.Profile_picture || "";

  const hiddenFormKeys = new Set(["firstName", "lastName", "first_name", "last_name", "email", "phone"]);
  const formEntries = Object.entries(formData).filter(([key]) => !hiddenFormKeys.has(key));

  const invalidateEnrollmentQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["enrollment", routeId] });
    queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
    queryClient.invalidateQueries({ queryKey: ["public-programs"] });
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/enrollments/${routeId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Enrollment approved");
      invalidateEnrollmentQueries();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to approve enrollment"),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/enrollments/${routeId}/reject`, { reason: rejectReason.trim() });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Enrollment rejected");
      setRejectOpen(false);
      setRejectReason("");
      invalidateEnrollmentQueries();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to reject enrollment"),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/enrollments/${routeId}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Enrollment cancelled");
      invalidateEnrollmentQueries();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to cancel enrollment"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/enrollments/${routeId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Enrollment removed");
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
      navigate("/dashboard/enrollments");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to remove enrollment"),
  });

  const copyToClipboard = async (text, label = "Value") => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (isLoading) return <MemberDetailsSkeleton />;

  if (isError || !enrollment) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        Error: {error?.response?.data?.message || error?.message || "Enrollment not found"}
      </div>
    );
  }

  const isPending = enrollment.status === "pending";
  const isTerminal = ["rejected", "cancelled"].includes(enrollment.status);
  const isActionLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300 pb-14 relative px-2 sm:px-0">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors dark:hover:bg-gray-700/60 dark:hover:border-gray-600"
          aria-label="Back"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-gray-200" />
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 tracking-tight">
              Enrollment Details
            </h1>
            <Badge status={enrollment.status} />
          </div>

          <div className="mt-2 flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              ID: <span className="font-semibold text-slate-700 dark:text-gray-100">{enrollment._id}</span>
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                copyToClipboard(enrollment._id, "Enrollment ID");
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border rounded-md hover:bg-slate-100 dark:bg-gray-700/40 dark:border-gray-600 dark:hover:bg-gray-700/30"
              title="Copy Enrollment ID"
            >
              <Clipboard size={14} /> Copy ID
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {isPending && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={isActionLoading}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2 text-xs md:text-sm font-semibold shadow-md transition-colors disabled:opacity-60"
              >
                {approveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Approve
              </button>
              <button
                onClick={() => setRejectOpen(true)}
                disabled={isActionLoading}
                className="px-3 py-1.5 md:px-4 md:py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 border border-red-100 dark:hover:bg-red-900/30 dark:border-red-800"
              >
                <XCircle size={16} /> Reject
              </button>
            </>
          )}

          {!isTerminal && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={isActionLoading}
              className="px-3 py-1.5 md:px-4 md:py-2  text-slate-700 rounded-xl flex items-center gap-2 text-xs md:text-sm font-medium border border-slate-200  hover:bg-slate-50  dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700/60 disabled:opacity-60"
            >
              {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              Cancel
            </button>
          )}

          <button
            onClick={() => setDeleteOpen(true)}
            disabled={isActionLoading}
            className="px-3 py-1.5 md:px-4 md:py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 border border-red-100 dark:hover:bg-red-900/30 dark:border-red-800"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <Card className="mb-6 relative overflow-hidden border-0 ring-1 ring-slate-200 dark:ring-gray-700">
        <div className="h-32 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-700 dark:from-orange-600 dark:to-orange-800" />
        <div className="px-6 md:px-8 pb-7">
          <div className="flex flex-col md:flex-row items-start md:items-center -mt-12 gap-5 md:gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-3xl md:text-4xl font-bold text-white bg-slate-700 dark:bg-slate-600 overflow-hidden">
              {profilePicture ? (
                <img src={profilePicture} alt={learnerName} className="w-full h-full object-cover" />
              ) : (
                getInitials(learnerName)
              )}
            </div>

            <div className="flex-1 min-w-0 mt-15">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100 truncate">
                    {learnerName}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-50 text-slate-700 border dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-600">
                      <FileText size={14} /> {program?.title || enrollment.programId || "Program N/A"}
                    </span>
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-50 text-slate-700 border dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-600">
                      <Calendar size={14} /> {formatDate(enrollment.enrolledAt || enrollment.createdAt)}
                    </span>
                    <Badge status={enrollment.status} />
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2">
                  {enrollment.attachment?.url && (
                    <a
                      href={enrollment.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-medium transition-colors dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700/40"
                    >
                      <Download size={16} /> Attachment
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User size={20} className="text-orange-500" /> Learner Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 text-sm">
              <InfoItem label="Full Name" value={learnerName} />
              <InfoItem label="Email" value={learnerEmail} />
              <InfoItem label="Phone" value={learnerPhone} />
              <InfoItem label="User ID" value={typeof enrollment.userId === "object" ? enrollment.userId?._id : enrollment.userId} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-orange-500" /> Enrollment Form
            </h3>
            {formEntries.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-6 text-sm">
                {formEntries.map(([key, value]) => (
                  <InfoItem key={key} label={humanizeKey(key)} value={renderValue(value)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No additional form answers were submitted.</p>
            )}
          </Card>

          {enrollment.note && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" /> Enrollment Note
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{enrollment.note}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-orange-500" /> Program
            </h3>
            <div className="space-y-4 text-sm">
              <InfoItem label="Program Title" value={program?.title || enrollment.programId} />
              <InfoItem label="Program ID" value={program?._id || enrollment.programId} />
              <InfoItem label="Capacity" value={program?.capacity} />
              <InfoItem label="Program Status" value={program?.status} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clipboard size={20} className="text-orange-500" /> Enrollment Metadata
            </h3>
            <div className="space-y-4 text-sm">
              <InfoItem label="Status" value={<Badge status={enrollment.status} />} />
              <InfoItem label="Created" value={formatDateTime(enrollment.createdAt)} />
              <InfoItem label="Updated" value={formatDateTime(enrollment.updatedAt)} />
              <InfoItem label="Attachment" value={enrollment.attachment?.filename || "No attachment"} />
              {enrollment.attachment?.size && <InfoItem label="Attachment Size" value={formatBytes(enrollment.attachment.size)} />}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Mail size={20} className="text-orange-500" /> Contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={16} className="text-slate-400" />
                <span className="break-all">{learnerEmail || "No email"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <Phone size={16} className="text-slate-400" />
                <span>{learnerPhone || "No phone"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-gray-100">Reject Enrollment</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Add an optional reason. It will be saved on the enrollment note.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Reason for rejection..."
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl  px-4 py-2 text-sm font-medium dark:bg-gray-800"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-gray-100">Remove Enrollment</h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              This will permanently remove this enrollment record for{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{program?.title || enrollment.programId}</span>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl  px-4 py-2 text-sm font-medium dark:bg-gray-800"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
