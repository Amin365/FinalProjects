

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import api from "@/app/api/apislice";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";

const fetchEnrollments = async ({ page, limit, mine }) => {
  const response = await api.get("/enrollments", {
    params: { page, limit, ...(mine ? { mine: true } : {}) },
  });
  return response.data;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();

const STATUS_CLASSES = {
  pending: "bg-slate-100 text-slate-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  waitlisted: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-700",
};

const EnrollmentsTable = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser } = useSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [limit] = useState(50);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const roleName = useMemo(() => {
    const roleSource = authUser?.role;
    if (!roleSource) return "";
    if (typeof roleSource === "object") {
      return String(roleSource.role || roleSource.name || roleSource.title || "").toLowerCase();
    }
    return String(roleSource).toLowerCase();
  }, [authUser]);

  const mine = /^(volunteer|teacher|library staff)$/.test(roleName);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["admin-enrollments", { page, limit, mine }],
    queryFn: () => fetchEnrollments({ page, limit, mine }),
    staleTime: 30_000,
  });

  const enrollments = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/enrollments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Enrollment removed");
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to remove enrollment");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/enrollments/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Enrollment approved");
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to approve enrollment");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/enrollments/${id}/reject`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Enrollment rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["public-programs"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to reject enrollment");
    },
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return enrollments;

    return enrollments.filter((item) => {
      const userName =
        typeof item.userId === "object"
          ? `${item.userId?.first_name || ""} ${item.userId?.last_name || ""} ${item.userId?.email || ""}`
          : item.userId || "";
      const programTitle =
        typeof item.programId === "object" ? item.programId?.title || "" : item.programId || "";

      return [userName, programTitle, item.status]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [enrollments, search]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enrollments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Real enrollment records saved from the program list.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-4 md:flex-row">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search learner, program, status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500">{filtered.length} results</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="p-3 text-left">Learner</th>
                <th className="p-3 text-left">Program</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Enrolled</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Loading enrollments...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-red-500">
                    Failed to load enrollments.
                  </td>
                </tr>
              )}

              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No enrollments found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                filtered.map((item) => {
                  const user =
                    typeof item.userId === "object"
                      ? item.userId
                      : { first_name: "", last_name: "", email: item.userId, Profile_picture: "" };
                  const program =
                    typeof item.programId === "object" ? item.programId : { title: item.programId };
                  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

                  return (
                    <tr
                      key={item._id}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => navigate(`/dashboard/enrollments/${item._id}`)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-100">
                            {user.Profile_picture || user.profile_picture || user.profileImage ? (
                              <img
                                src={user.Profile_picture || user.profile_picture || user.profileImage}
                                alt={fullName || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-semibold text-orange-600">{getInitials(fullName || user.email || "U")}</span>
                            )}
                          </div>

                          <div>
                            <div className="font-semibold">{fullName || "Unknown user"}</div>
                            <div className="text-xs text-slate-500">{user.email || "-"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">{program.title || "-"}</td>

                      <td className="p-3">
                        <Badge className={cn("border-0 capitalize", STATUS_CLASSES[item.status] || STATUS_CLASSES.confirmed)}>
                          {item.status}
                        </Badge>
                      </td>

                      <td className="p-3">{formatDate(item.enrolledAt || item.createdAt)}</td>

                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="rounded p-2 hover:bg-emerald-50 disabled:opacity-60"
                                title="Approve"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  approveMutation.mutate(item._id);
                                }}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="h-4 w-4 text-emerald-600" />
                              </button>
                              <button
                                type="button"
                                className="rounded p-2 hover:bg-red-50 disabled:opacity-60"
                                title="Reject"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  const ok = window.confirm("Reject this enrollment request?");
                                  if (ok) rejectMutation.mutate(item._id);
                                }}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="rounded p-2 hover:bg-slate-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/dashboard/enrollments/${item._id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 text-slate-600" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-2 hover:bg-slate-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(item);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold">Remove Enrollment</h3>
            <p className="mb-6 text-sm text-slate-500">
              This will permanently remove the enrollment record for{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {typeof deleteTarget.programId === "object" ? deleteTarget.programId?.title : deleteTarget.programId}
              </span>
              .
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded bg-slate-100 px-4 py-2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-red-600 px-4 py-2 text-white"
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsTable;
