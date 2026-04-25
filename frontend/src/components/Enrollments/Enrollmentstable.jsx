import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Trash2, Plus } from "lucide-react";
import api from "@/app/api/apislice";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// OPTIONAL (if using navigation)
// import { useRouter } from "next/navigation";

const fetchEnrollments = async ({ page, limit }) => {
  const res = await api.get("/enrollments", { params: { page, limit } });
  return res.data;
};

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString() : "-";

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const EnrollmentsTable = () => {
  const queryClient = useQueryClient();
  // const router = useRouter(); // enable if using navigation

  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [limit] = useState(50);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["admin-enrollments", { page, limit }],
    queryFn: () => fetchEnrollments({ page, limit }),
    staleTime: 30000,
  });

  const enrollments = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/enrollments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Enrollment removed");
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      setIsDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to remove enrollment");
      setIsDialogOpen(false);
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return enrollments.filter((e) => {
      const haystack = [
        e.userId?.first_name,
        e.userId?.last_name,
        e.userId?.email,
        e.programId?.title,
        e.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [enrollments, search]);

  const confirmDelete = (enrollment) => {
    setDeleteTarget(enrollment);
    setIsDialogOpen(true);
  };

  const handleAddEnrollment = () => {
    // OPTION 1: open modal (implement later)
    console.log("Open Add Enrollment Modal");

    // OPTION 2: navigate
    // router.push("/admin/enrollments/create");
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Enrollments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Manage users enrolled in your programs.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <Button variant="outline" onClick={refetch} disabled={isFetching}>
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>

          {/* Add Enrollment */}
          <Button
            onClick={handleAddEnrollment}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Enrollment
          </Button>
        </div>
      </div>

      {/* SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search users, program, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500">
            {filtered.length} results
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b">
              <tr>
                <th className="p-3 text-left">User</th>
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
                    Failed to load enrollments
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No enrollments found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((e) => (
                  <tr
                    key={e._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    {/* USER */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                          {e.userId?.profileImage ? (
                            <img
                              src={e.userId.profileImage}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-orange-600 font-semibold">
                              {getInitials(
                                `${e.userId?.first_name || ""} ${
                                  e.userId?.last_name || ""
                                }`
                              )}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="font-semibold">
                            {e.userId?.first_name} {e.userId?.last_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {e.userId?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PROGRAM */}
                    <td className="p-3">
                      {e.programId?.title || "-"}
                    </td>

                    {/* STATUS */}
                    <td className="p-3">
                      <Badge
                        className={cn(
                          "border-0",
                          e.status === "active" &&
                            "bg-green-100 text-green-700",
                          e.status === "pending" &&
                            "bg-yellow-100 text-yellow-700",
                          e.status === "completed" &&
                            "bg-blue-100 text-blue-700"
                        )}
                      >
                        {e.status}
                      </Badge>
                    </td>

                    {/* DATE */}
                    <td className="p-3">
                      {formatDate(e.enrolledAt)}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-3 text-right">
                      <button
                        className="p-2 hover:bg-slate-100 rounded"
                        onClick={() => confirmDelete(e)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DELETE MODAL */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Remove Enrollment
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to remove this user from the program?
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-slate-100 rounded"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() =>
                  deleteMutation.mutate(deleteTarget?._id)
                }
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsTable;