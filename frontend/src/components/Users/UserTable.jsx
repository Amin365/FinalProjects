import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fetchUsers = async ({ queryKey }) => {
  const [, page = 1, limit = 10] = queryKey;
  const res = await api.get("/users", { params: { page, limit } });
  return res.data;
};

const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "N/A");

const RoleBadge = ({ role }) => {
  const label = role?.role || role?.name || "No Role";
  const color = role?.color;

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border",
        "bg-slate-100 text-slate-800 border-slate-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
      )}
      style={color ? { borderColor: color, color } : undefined}
    >
      {label}
    </span>
  );
};

const UsersTable = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["users", currentPage, limit],
    queryFn: fetchUsers,
    keepPreviousData: true,
    staleTime: 30_000,
  });



  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/users/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success("User status updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Failed to update status";
      toast.error(msg);
    },
  });

  const handleToggleStatus = (e, user) => {
    e.stopPropagation();
    const next = user.status === "Active" ? "Inactive" : "Active";
    updateStatusMutation.mutate({ id: user._id || user.id, status: next });
  };


  const users = data?.data ?? [];

  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / limit) : 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, limit]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (!q) return true;

      const fullName =
        u.member?.full_name ||
        [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ");

      return (
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (fullName && fullName.toLowerCase().includes(q))
      );
    });
  }, [users, searchTerm]);

  const handleRowClick = (id) => navigate(`/dashboard/users/${id}`);

  const handleViewDetails = (e, id) => {
    e.stopPropagation();
    navigate(`/dashboard/users/${id}`);
  };

  const handlePageChange = (newPage) => {
    if (!isLoading && !isFetching && newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * limit, totalItems);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 p-4 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Users</h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-gray-300">Manage system users created from members.</p>
        </div>

        <div className="flex gap-3">
          <Button 
          className="dark:bg-orange-600"
          onClick={() => navigate("/dashboard/users/new")}>
            <Plus size={16} /> <span className="ml-2">Create User</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-11 relative w-70">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              className="pl-10"
              placeholder="Search by username, email, or full name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="md:col-span-1 flex justify-end">
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-white">
              {filteredUsers.length}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">User</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Username</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Email</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Role</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Status</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white">Created</th>
                <th className="p-4 font-semibold text-slate-500 dark:text-white text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {filteredUsers.map((u) => {
                const fullName =
                  u.member?.full_name ||
                  [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(" ");

                return (
                  <tr
                    key={u._id || u.id}
                    onClick={() => handleRowClick(u._id || u.id)}
                    className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded flex items-center justify-center font-medium text-white shadow-sm bg-gradient-to-br from-orange-500 to-indigo-600">
  {u.member?.Profile_picture ? (
    <img
      src={u.member.Profile_picture||u.profile_picture}
      alt={fullName}
      className="w-full h-full object-cover rounded"
    />
  ) : (
    <span className="font-medium rounded  text-white bg-gradient-to-br from-orange-500 to-indigo-600 w-full h-full flex items-center justify-center">
      {fullName?.charAt(0)?.toUpperCase() || "U"}
    </span>
  )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{fullName || "—"}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-300">
                          Member: {u.member ? "Linked" : "Not linked"}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-white">{u.username}</td>
                    <td className="p-4 text-slate-700 dark:text-white">{u.email}</td>
                    <td className="p-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-xs font-semibold",
                          u.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100"
                            : u.status === "Inactive"
                            ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100"
                        )}
                      >
                        {u.status || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-white">{formatDate(u.createdAt)}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleViewDetails(e, u._id || u.id)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant={u.status === "Active" ? "destructive" : "default"}
                          onClick={(e) => handleToggleStatus(e, u)}
                          disabled={updateStatusMutation.isLoading}
                        >
                          {u.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-gray-400">
                    Loading users...
                  </td>
                </tr>
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-red-500">
                    Failed to load users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* <div className="flex justify-between items-center p-4 border-t border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {totalItems === 0 ? "Showing 0 results" : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading || isFetching}
            >
              <ChevronLeft size={16} /> Previous
            </Button>

            <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-orange-100 dark:bg-orange-600 text-orange-600 dark:text-white">
              {currentPage} / {totalPages}
            </span>

            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading || isFetching}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div> */}

         <div className="flex justify-between items-center p-4 border-t border-border bg-card gap-4">
          <p className="text-sm md:block hidden text-muted-foreground whitespace-nowrap">
            {totalItems === 0
              ? "Showing 0 results"
              : `Showing ${startItem} to ${endItem} of ${totalItems} results`}
          </p>
        
          <div className="flex items-center ml-12 gap-2 whitespace-nowrap">
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading || isFetching}
              className="flex items-center dark:bg-orange-600 gap-1 whitespace-nowrap"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
        
            <span className="px-3 py-2 rounded-lg text-sm font-semibold bg-muted text-foreground whitespace-nowrap">
              {currentPage} / {totalPages}
            </span>
        
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0 || isLoading || isFetching}
              className="flex items-center dark:bg-orange-600 gap-1 whitespace-nowrap"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsersTable;