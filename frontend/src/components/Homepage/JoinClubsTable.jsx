import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import { cn } from "@/lib/utils";
import JoinClub from "./JoinClub";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const fetchJoinClubs = async ({ queryKey }) => {
  const [, page = 1, limit = 10, statusFilter = ""] = queryKey;
  const params = { page, limit };
  if (statusFilter) params.status = statusFilter;
  const res = await api.get("/join-club", { params });
  return res.data;
};

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString() : "-";

const StatusBadge = ({ status }) => (
  <span
    className={cn(
      "px-2 py-1 rounded-md text-xs font-semibold",
      status === "Approved"
        ? "text-green-700 dark:bg-green-800 dark:text-green-100"
        : status === "Rejected"
          ? "text-red-700 dark:bg-red-800 dark:text-red-100"
          : "text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100"
    )}
  >
    {status}
  </span>
);

const JoinClubsTable = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["join-clubs", currentPage, limit, statusFilter],
    queryFn: fetchJoinClubs,
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const requests = useMemo(() => data?.data ?? [], [data?.data]);
  const totalItems = data?.count ?? requests.length;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((request) =>
      [request.FullName, request.email, request.phone].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [requests, searchTerm]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * limit, totalItems);
  const statusTabs = ["", "Pending", "Approved", "Rejected"];

  const openDetails = (requestId) => {
    navigate(`/dashboard/join-clubs/${requestId}`);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 p-4 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            Teachers Management
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">
            Review applications and manage teacher accounts.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Plus size={16} /> New Teacher
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusTabs.map((status) => (
          <button
            key={status || "all"}
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
              statusFilter === status
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:border-orange-300"
            )}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              className="pl-10"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-span-12 md:col-span-8 flex justify-end">
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-gray-700">
              {filteredRequests.length}
            </span>
          </div>
        </CardContent>
      </Card>

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
              {filteredRequests.map((request) => (
                <tr
                  key={request._id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                  onClick={() => openDetails(request._id)}
                >
                  <td className="p-4 font-medium">{request.FullName}</td>
                  <td className="p-4">{request.email}</td>
                  <td className="p-4">{request.phone}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={request.status} />
                      {request.rejectionReason && (
                        <span className="text-[11px] text-red-500 italic">{request.rejectionReason}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{formatDate(request.createdAt)}</td>
                  <td className="p-4 text-slate-500 text-xs">
                    {request.reviewedBy
                      ? `${request.reviewedBy.first_name || ""} ${request.reviewedBy.last_name || ""}`.trim() || request.reviewedBy.username
                      : "-"}
                    {request.reviewedAt && (
                      <div className="text-[10px] text-slate-400">{formatDate(request.reviewedAt)}</div>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetails(request._id);
                      }}
                      className="gap-1"
                    >
                      <Eye size={14} /> {request.status === "Pending" ? "Review" : "Details"}
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

        <div className="flex justify-between items-center p-4 border-t">
          <p className="text-sm text-muted-foreground hidden md:block">
            {totalItems === 0
              ? "Showing 0 results"
              : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages || isLoading || isFetching}
              className="dark:bg-orange-600"
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      <JoinClub
        open={createOpen}
        onOpenChange={setCreateOpen}
        adminCreate
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["join-clubs"] });
          toast.success("Teacher created and approved");
        }}
      />
    </div>
  );
};

export default JoinClubsTable;
