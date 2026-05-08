import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Search, RefreshCw, Plus, Trash2, Edit2, X,
  BookOpen,
} from "lucide-react";
import api from "@/app/api/apislice";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/*  constants  */

const STATUS_STYLES = {
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive:  "bg-slate-100   text-slate-600   border-slate-200",
  completed: "bg-blue-100    text-blue-700    border-blue-200",
  draft:     "bg-amber-100   text-amber-700   border-amber-200",
};

const STATUS_DOT = {
  active:    "bg-emerald-500",
  inactive:  "bg-slate-400",
  completed: "bg-blue-500",
  draft:     "bg-amber-500",
};

const EMPTY_FORM = {
  _id: "", title: "", description: "", capacity: 20,
  teacherId: "", assistants: "", startDate: "", endDate: "", status: "active",
};

/*  helpers  */

const fetchPrograms = ({ page, limit }) =>
  api.get("/programs", { params: { page, limit } }).then((r) => r.data);

const fetchAvailableTeachers = () =>
  api.get("/programs/teachers/available").then((r) => r.data);

const fmt = (d) => {
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return ""; }
};

/*  small reusable form field  */

const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}{required && <span className="text-orange-500 ml-0.5">*</span>}
  </label>
);

const FieldWrap = ({ children, className = "" }) => (
  <div className={cn("flex flex-col", className)}>{children}</div>
);

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 " +
  "text-slate-800 dark:text-gray-100 placeholder:text-slate-300 dark:placeholder:text-gray-600 " +
  "focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-800 focus:border-orange-400 transition-all";

/*  main component  */

const ProgramTable = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch]           = useState("");
  const [page]                        = useState(1);
  const [limit]                       = useState(50);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode]     = useState("create");
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  /* queries */
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["programs", { page, limit }],
    queryFn: () => fetchPrograms({ page, limit }),
    staleTime: 30_000,
  });


  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ["available-teachers"],
    queryFn: fetchAvailableTeachers,
    staleTime: 60_000,
  });

  const teachers = teachersData?.data || [];

  const programs = useMemo(() => data?.data || [], [data?.data]);

  console.log("prog",programs)
  /* mutations */
  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/programs", payload).then((r) => r.data),
    onSuccess: () => { toast.success("Program created"); qc.invalidateQueries({ queryKey: ["programs"] }); closeModal(); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create program"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/programs/${id}`, payload).then((r) => r.data),
    onSuccess: () => { toast.success("Program updated"); qc.invalidateQueries({ queryKey: ["programs"] }); closeModal(); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update program"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/programs/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success("Program deleted"); qc.invalidateQueries({ queryKey: ["programs"] }); setDeleteTarget(null); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete program"),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  /* filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) =>
      [p._id, p.title, p.description, p.teacherId, p.status].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [programs, search]);

  /* modal helpers */
  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openCreateModal = () => {
    setModalMode("create"); setEditingProgram(null); setForm(EMPTY_FORM); setIsModalOpen(true);
  };

  const openEditModal = (program) => {
    setModalMode("edit"); setEditingProgram(program);
    setForm({
      _id: program._id || "",
      title: program.title || "",
      description: program.description || "",
      capacity: program.capacity || 1,
      teacherId: program.teacherId || "",
      teacherName: program.teacher.fullName || "",
      assistants: Array.isArray(program.assistants) ? program.assistants.join(", ") : "",
      startDate: program.startDate ? new Date(program.startDate).toISOString().slice(0, 10) : "",
      endDate: program.endDate ? new Date(program.endDate).toISOString().slice(0, 10) : "",
      status: program.status || "active",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingProgram(null); setForm(EMPTY_FORM); };

  const submitModal = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.teacherId.trim()) return toast.error("Teacher is required");
    if (!form.startDate || !form.endDate) return toast.error("Start and end dates are required");

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      assistants: form.assistants ? form.assistants.split(",").map((x) => x.trim()).filter(Boolean) : [],
    };

    if (modalMode === "edit") {
      const { _id, ...updatePayload } = payload;
      updateMutation.mutate({ id: editingProgram._id, payload: updatePayload });
    } else {
      const { _id, ...createPayload } = payload;
      createMutation.mutate(createPayload);
    }
  };

  /*  render  */
  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Programs</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage program schedules and capacity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refetch} disabled={isFetching} className="rounded-xl">
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          <Button onClick={openCreateModal} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-2 px-4">
            <Plus className="h-4 w-4" /> New Program
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <Card className="rounded-2xl border-slate-200 dark:border-gray-800 shadow-sm">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus-visible:ring-orange-300"
              placeholder="Search by title, teacher, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} results</span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-gray-800/60 border-b border-slate-200 dark:border-gray-700">
              <tr>
                {["Title", "Teacher", "Capacity", "Dates", "Status", ""].map((h) => (
                  <th key={h} className={cn("p-3 text-xs font-semibold uppercase tracking-wider text-slate-500", h === "" ? "text-right" : "text-left")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Loading programs…</td></tr>
              )}
              {!isLoading && error && (
                <tr><td colSpan={6} className="py-12 text-center text-red-500 text-sm">Failed to load programs.</td></tr>
              )}
              {!isLoading && !error && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No programs found.</td></tr>
              )}
              {!isLoading && !error && filtered.map((p, i) => (
                <tr
                  key={p._id}
                  className={cn(
                    "cursor-pointer border-t border-slate-100 dark:border-gray-800 transition-colors hover:bg-slate-50/60 dark:hover:bg-gray-800/30",
                    i % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-gray-900/20"
                  )}
                  onClick={() => navigate(`/dashboard/programme/${p._id}`)}
                >
                  <td className="p-3 font-semibold text-slate-800 dark:text-white max-w-[180px] truncate">{p.title}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 text-xs">{p.teacherName}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.capacity}</td>
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmt(p.startDate)} → {fmt(p.endDate)}
                  </td>
                  <td className="p-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", STATUS_STYLES[p.status] || STATUS_STYLES.active)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[p.status] || STATUS_DOT.active)} />
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(p);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(p);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/*  Create / Edit Modal  */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                  <BookOpen size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {modalMode === "edit" ? "Edit Program" : "New Program"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === "edit" ? "Update program details below." : "Fill in the details to create a new program."}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

                {/* Title  full width */}
                <FieldWrap className="md:col-span-2">
                  <Label required>Program Title</Label>
                  <input className={inputCls} placeholder="e.g. Advanced Python Bootcamp" value={form.title} onChange={f("title")} />
                </FieldWrap>

                {/* Teacher */}
                <FieldWrap>
                  <Label required>Teacher</Label>
                  <select
                    className={inputCls}
                    value={form.teacherId}
                    onChange={f("teacherId")}
                    disabled={teachersLoading}
                  >
                    <option value="">{teachersLoading ? "Loading teachers…" : "Select a teacher"}</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.fullName || t.email || t._id}
                      </option>
                    ))}
                  </select>
                </FieldWrap>

                {/* Capacity */}
                <FieldWrap>
                  <Label required>Capacity</Label>
                  <input
                    className={inputCls} type="number" min={1} placeholder="20"
                    value={form.capacity} onChange={f("capacity")}
                  />
                </FieldWrap>

                {/* Start date */}
                <FieldWrap>
                  <Label required>Start Date</Label>
                  <input className={inputCls} type="date" value={form.startDate} onChange={f("startDate")} />
                </FieldWrap>

                {/* End date */}
                <FieldWrap>
                  <Label required>End Date</Label>
                  <input className={inputCls} type="date" value={form.endDate} onChange={f("endDate")} />
                </FieldWrap>

                {/* Status */}
                <FieldWrap className="md:col-span-2">
                  <Label>Status</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["active", "inactive", "completed", "draft"].map((s) => {
                      const isActive = form.status === s;
                      return (
                        <button
                          key={s} type="button"
                          onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                          className={cn(
                            "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all",
                            isActive
                              ? cn(STATUS_STYLES[s], "ring-2 ring-offset-1 ring-current")
                              : "border-slate-200 dark:border-gray-700 text-slate-500 hover:border-slate-300 dark:hover:border-gray-600"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? STATUS_DOT[s] : "bg-slate-300")} />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </FieldWrap>

                {/* Assistants */}
                <FieldWrap className="md:col-span-2">
                  <Label>Assistant IDs</Label>
                  <input
                    className={inputCls} placeholder="asst1, asst2, asst3 (comma separated)"
                    value={form.assistants} onChange={f("assistants")}
                  />
                  <p className="text-xs text-slate-400 mt-1">Separate multiple IDs with commas.</p>
                </FieldWrap>

                {/* Description */}
                <FieldWrap className="md:col-span-2">
                  <Label>Description</Label>
                  <textarea
                    rows={3} className={cn(inputCls, "resize-none")}
                    placeholder="Brief description of the program…"
                    value={form.description} onChange={f("description")}
                  />
                </FieldWrap>

                {/* ID (edit mode only) */}
                {modalMode === "edit" && (
                  <FieldWrap className="md:col-span-2">
                    <Label>Program ID</Label>
                    <input className={cn(inputCls, "font-mono opacity-60 cursor-not-allowed")} value={form._id} disabled />
                  </FieldWrap>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/60 dark:bg-gray-900/40">
              <Button variant="outline" onClick={closeModal} className="rounded-xl px-5">Cancel</Button>
              <Button
                onClick={submitModal}
                disabled={isSubmitting}
                className="rounded-xl px-5 bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                {isSubmitting
                  ? (modalMode === "edit" ? "Saving…" : "Creating…")
                  : (modalMode === "edit" ? "Save Changes" : "Create Program")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/*  Delete Confirm Modal  */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Delete Program</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to permanently delete <span className="font-semibold text-slate-700 dark:text-slate-200">"{deleteTarget.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Cancel</Button>
              <Button
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramTable;
