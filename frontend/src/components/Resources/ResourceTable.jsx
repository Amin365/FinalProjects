import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Download,
  FileText,
  FileSpreadsheet,
  Link as LinkIcon,
  Video,
} from "lucide-react";
import api from "@/app/api/apislice";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_ICON = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  ppt: FileSpreadsheet,
  pptx: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  video: Video,
  link: LinkIcon,
  other: FileText,
};

const ACCESS_STYLES = {
  public: "bg-green-100 text-green-700",
  private: "bg-slate-200 text-slate-700",
  "program-only": "bg-blue-100 text-blue-700",
};

const fetchResources = async ({ page, limit }) => {
  const res = await api.get("/resources", { params: { page, limit } });
  return res.data;
};

const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "-");

const getUploaderName = (user) => {
  if (!user) return "-";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email || "-";
};

const ResourceTable = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [limit] = useState(50);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-resources", { page, limit }],
    queryFn: () => fetchResources({ page, limit }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const resources = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/resources/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Resource deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      setIsDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete resource");
      setIsDialogOpen(false);
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resources;

    return resources.filter((r) => {
      const haystack = [
        r.title,
        r.description,
        r.type,
        r.category,
        r.accessLevel,
        r.programId?.title,
        r.uploadedBy?.email,
        r.uploadedBy?.first_name,
        r.uploadedBy?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [resources, search]);

  const confirmDelete = (resource) => {
    setDeleteTarget(resource);
    setIsDialogOpen(true);
  };

  const handleRow = (resource) => {
    if (!resource?._id) return;
    navigate(`/dashboard/resources/${resource._id}`);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resources</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Manage uploaded files and learning resources.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>

          <Button className="dark:bg-orange-600" onClick={() => navigate("/dashboard/resources/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Resource
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search title, type, category, program, uploader..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-300">{filtered.length} results</div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Title</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Access</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Program</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Uploaded By</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Downloads</th>
                <th className="text-left p-3 font-semibold text-slate-600 dark:text-slate-300">Created</th>
                <th className="text-right p-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    Loading resources...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-red-500">
                    Failed to load resources
                  </td>
                </tr>
              )}

              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    No resources found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                filtered.map((resource) => {
                  const Icon = TYPE_ICON[resource.type] || FileText;

                  return (
                    <tr
                      key={resource._id}
                      onClick={() => handleRow(resource)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{resource.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-300 truncate max-w-[280px]">
                          {resource.description || "-"}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Icon className="w-4 h-4" />
                          {resource.type}
                        </span>
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-200">{resource.category || "-"}</td>

                      <td className="p-3">
                        <Badge className={cn("border-0", ACCESS_STYLES[resource.accessLevel] || ACCESS_STYLES.public)}>
                          {resource.accessLevel || "public"}
                        </Badge>
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-200">{resource.programId?.title || "-"}</td>

                      <td className="p-3 text-slate-700 dark:text-slate-200">{getUploaderName(resource.uploadedBy)}</td>

                      <td className="p-3 text-slate-700 dark:text-slate-200">
                        <span className="inline-flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          {resource.downloads || 0}
                        </span>
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-200">{formatDate(resource.createdAt)}</td>

                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/resources/edit/${resource._id}`);
                            }}
                          >
                            <Edit2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </button>

                          <button
                            className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(resource);
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

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Resource</h3>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deleteTarget?._id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceTable;