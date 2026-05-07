
import React, { useEffect, useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye, Plus } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/app/api/apislice"
import { cn } from "@/lib/utils"
import JoinClub from "./JoinClub"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/* 
   API
 */
const fetchJoinClubs = async ({ queryKey }) => {
  const [, page = 1, limit = 10, statusFilter = ""] = queryKey
  const params = { page, limit }
  if (statusFilter) params.status = statusFilter
  const res = await api.get("/join-club", { params })
  return res.data
}

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString() : "—"

/* 
   Status Badge
 */
const StatusBadge = ({ status }) => (
  <span
    className={cn(
      "px-2 py-1 rounded-md text-xs font-semibold",
      status === "Approved"
        ? " text-green-700 dark:bg-green-800 dark:text-green-100"
        : status === "Rejected"
        ? " text-red-700 dark:bg-red-800 dark:text-red-100"
        : "text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100"
    )}
  >
    {status}
  </span>
)

/* 
   Review Dialog
 */
const ReviewDialog = ({ request, onClose, onSubmit, isLoading }) => {
  const [rejectionReason, setRejectionReason] = useState("")
  const [action, setAction] = useState(null) // "Approved" | "Rejected"

  const handleConfirm = () => {
    if (!action) return
    onSubmit({ id: request._id, status: action, rejectionReason: action === "Rejected" ? rejectionReason : "" })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6">
        <h2 className="text-lg font-bold mb-1 dark:text-white">Review Join Request</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          Reviewing request from <span className="font-semibold text-slate-700 dark:text-white">{request.FullName}</span> ({request.email})
        </p>

        <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4 text-sm mb-4 space-y-1">
          <div className="mb-3"><span className="text-slate-500">Phone:</span> {request.phone}</div>
          <div className="mb-3"><span className="text-slate-500">Requested:</span> {formatDate(request.createdAt)}</div>
          <div className="mb-3"><span className="text-slate-500">Status:</span> <StatusBadge status={request.status} /></div>
        </div>

        {/* Action selector */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setAction("Approved")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition",
              action === "Approved"
                ? "bg-green-600 text-white border-green-600"
                : "border-slate-200 dark:border-gray-600 dark:text-gray-200 hover:border-green-400"
            )}
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button
            onClick={() => setAction("Rejected")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition",
              action === "Rejected"
                ? "bg-red-600 text-white border-red-600"
                : "border-slate-200 dark:border-gray-600 dark:text-gray-200 hover:border-red-400"
            )}
          >
            <XCircle size={16} /> Reject
          </button>
        </div>

        {action === "Rejected" && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 dark:text-gray-300 mb-1">
              Rejection reason <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        )}

        {action === "Approved" && (
          <p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
            A member record will be created for this applicant and they will be notified.
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button
            disabled={!action || isLoading}
            onClick={handleConfirm}
            className={cn(
              action === "Approved" ? "bg-green-600 hover:bg-green-700" : action === "Rejected" ? "bg-red-600 hover:bg-red-700" : ""
            )}
          >
            {isLoading ? "Processing…" : `Confirm ${action || ""}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* 
   Component
 */
const JoinClubsTable = () => {
  const queryClient = useQueryClient()

  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [reviewTarget, setReviewTarget] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["join-clubs", currentPage, limit, statusFilter],
    queryFn: fetchJoinClubs,
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }) => {
      const res = await api.patch(`/join-club/${id}/status`, { status, rejectionReason })
      return res.data
    },
    onSuccess: (_, vars) => {
      toast.success(`Request ${vars.status.toLowerCase()} successfully`)
      queryClient.invalidateQueries({ queryKey: ["join-clubs"] })
      setReviewTarget(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update status")
    },
  })

  const requests = data?.data ?? []
  const totalItems = data?.count ?? requests.length
  const totalPages =
    data?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((r) =>
      [r.FullName, r.email, r.phone].some((field) =>
        field?.toLowerCase().includes(q)
      )
    )
  }, [requests, searchTerm])

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * limit, totalItems)

  const statusTabs = ["", "Pending", "Approved", "Rejected"]

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 p-4 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            Teachers Managements
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">
            Review and manage Teachers .
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus size={16} /> New Teacher 
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
              statusFilter === s
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:border-orange-300"
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              className="pl-10"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-span-8 flex justify-end">
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-gray-700">
              {filteredRequests.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-gray-900 border-b">
              <tr>
                <th className="p-4 font-semibold">Full Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Requested At</th>
                <th className="p-4 font-semibold">Reviewed By</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredRequests.map((r) => (
                <tr
                  key={r._id}
                  className="hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="p-4 font-medium">{r.FullName}</td>
                  <td className="p-4">{r.email}</td>
                  <td className="p-4">{r.phone}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={r.status} />
                      {r.rejectionReason && (
                        <span className="text-[11px] text-red-500 italic">{r.rejectionReason}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{formatDate(r.createdAt)}</td>
                  <td className="p-4 text-slate-500 text-xs">
                    {r.reviewedBy
                      ? `${r.reviewedBy.first_name || ""} ${r.reviewedBy.last_name || ""}`.trim() || r.reviewedBy.username
                      : "—"}
                    {r.reviewedAt && (
                      <div className="text-[10px] text-slate-400">{formatDate(r.reviewedAt)}</div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={r.status !== "Pending"}
                      onClick={() => setReviewTarget(r)}
                      className="gap-1"
                    >
                      <Eye size={14} /> Review
                    </Button>
                  </td>
                </tr>
              ))}

              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    Loading requests...
                  </td>
                </tr>
              )}

              {!isLoading && filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No join requests found.
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-red-500">
                    Failed to load join requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <p className="text-sm text-muted-foreground hidden md:block">
            {totalItems === 0
              ? "Showing 0 results"
              : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading || isFetching}
              className="dark:bg-orange-600"
            >
              <ChevronLeft size={16} /> Previous
            </Button>

            <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-muted">
              {currentPage} / {totalPages}
            </span>

            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading || isFetching}
              className="dark:bg-orange-600"
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Review dialog */}
      {reviewTarget && (
        <ReviewDialog
          request={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={(vars) => updateStatusMutation.mutate(vars)}
          isLoading={updateStatusMutation.isPending}
        />
      )}

      <JoinClub
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["join-clubs"] })
          toast.success("Teacher request submitted")
        }}
      />
    </div>
  )
}

export default JoinClubsTable
