import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, Mail, Phone, User, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/Loader";

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString() : "-";

const StatusBadge = ({ status }) => (
  <span
    className={cn(
      "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
      status === "Approved"
        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200"
        : status === "Rejected"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
          : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
    )}
  >
    {status}
  </span>
);

const InfoItem = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-gray-100">{value || "N/A"}</p>
  </div>
);

export default function JoinClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: request, isLoading, isError, error } = useQuery({
    queryKey: ["join-club", id],
    queryFn: async () => {
      const res = await api.get(`/join-club/${id}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, rejectionReason: reason }) => {
      const res = await api.patch(`/join-club/${id}/status`, { status, rejectionReason: reason });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.status.toLowerCase()} successfully`);
      queryClient.invalidateQueries({ queryKey: ["join-clubs"] });
      queryClient.invalidateQueries({ queryKey: ["join-club", id] });
      setAction(null);
      setRejectionReason("");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  if (isLoading) return <Loader />;

  if (isError || !request) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        {error?.response?.data?.message || "Teacher application not found"}
      </div>
    );
  }

  const isPending = request.status === "Pending";
  const reviewedBy = request.reviewedBy
    ? `${request.reviewedBy.first_name || ""} ${request.reviewedBy.last_name || ""}`.trim() || request.reviewedBy.username
    : "Not reviewed";

  const submitDecision = () => {
    if (!action) return;
    updateStatusMutation.mutate({
      status: action,
      rejectionReason: action === "Rejected" ? rejectionReason : "",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-100 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Teacher Application</p>
              <StatusBadge status={request.status} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{request.FullName}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Submitted {formatDate(request.createdAt)}
            </p>
          </div>
        </div>

        {isPending && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setAction("Approved")}
              className={cn("gap-2 bg-green-600 hover:bg-green-700", action === "Approved" && "ring-2 ring-green-300")}
            >
              <CheckCircle size={16} /> Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => setAction("Rejected")}
              className={cn("gap-2 text-red-600 hover:bg-red-50", action === "Rejected" && "ring-2 ring-red-300")}
            >
              <XCircle size={16} /> Reject
            </Button>
          </div>
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="w-full min-w-0 space-y-6 lg:col-span-2">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <User size={20} className="text-orange-500" /> Applicant Information
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <InfoItem label="Full Name" value={request.FullName} />
                <InfoItem label="Email" value={request.email} />
                <InfoItem label="Phone" value={request.phone} />
                <InfoItem label="Ready To Teach" value={request.readyToTeach === null || request.readyToTeach === undefined ? "N/A" : request.readyToTeach ? "Yes" : "No"} />
                <InfoItem label="Education Level" value={request.education_level} />
                <InfoItem label="Institution" value={request.institution} />
                <InfoItem label="Teach Areas" value={Array.isArray(request.teachAreas) && request.teachAreas.length ? request.teachAreas.join(", ") : ""} className="sm:col-span-2" />
                <InfoItem label="Availability" value={request.availability} className="sm:col-span-2" />
                <InfoItem label="Motivation" value={request.motivation} className="sm:col-span-2" />
              </div>
            </CardContent>
          </Card>

          {isPending && action === "Rejected" && (
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Rejection Reason
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                />
              </CardContent>
            </Card>
          )}

          {isPending && action === "Approved" && (
            <Card className="rounded-2xl border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CardContent className="p-6 text-sm text-green-700 dark:text-green-200">
                Approving this application will create or activate the teacher member record, create or invite the user account, and send setup instructions.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="w-full min-w-0 space-y-6">
          <Card className="rounded-2xl">
            <CardContent className="space-y-5 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Status</h2>
              <InfoItem label="Status" value={<StatusBadge status={request.status} />} />
              <InfoItem label="Reviewed By" value={reviewedBy} />
              <InfoItem label="Reviewed At" value={request.reviewedAt ? formatDate(request.reviewedAt) : "Not reviewed"} />
              {request.rejectionReason && <InfoItem label="Rejection Reason" value={request.rejectionReason} />}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="space-y-5 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Created Records</h2>
              <InfoItem label="Member" value={request.memberId?.code || request.memberId?.email || "Not created"} />
              <InfoItem label="User" value={request.userId?.username || request.userId?.email || "Not created"} />
              <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-300">
                <span className="flex items-center gap-2"><Mail size={15} /> {request.email}</span>
                <span className="flex items-center gap-2"><Phone size={15} /> {request.phone || "No phone"}</span>
              </div>
            </CardContent>
          </Card>

          {isPending && (
            <Button
              disabled={!action || updateStatusMutation.isPending}
              onClick={submitDecision}
              className={cn(
                "w-full",
                action === "Approved" ? "bg-green-600 hover:bg-green-700" : action === "Rejected" ? "bg-red-600 hover:bg-red-700" : ""
              )}
            >
              {updateStatusMutation.isPending ? "Processing..." : `Confirm ${action || "Decision"}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
