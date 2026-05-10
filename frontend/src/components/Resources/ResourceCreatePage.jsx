import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  FileText,
  Shield,
  Link as LinkIcon,
  ChevronLeft,
  Loader,
  UploadCloud,
  X,
  FolderOpen,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import api from "@/app/api/apislice";
import { toast } from "sonner";
import { getRoleName, isAdminRoleName } from "@/lib/permissions";

const RESOURCE_TYPES = [
  { value: "pdf", label: "PDF", icon: "📄" },
  { value: "doc", label: "DOC", icon: "📝" },
  { value: "docx", label: "DOCX", icon: "📝" },
  { value: "ppt", label: "PPT", icon: "📊" },
  { value: "pptx", label: "PPTX", icon: "📊" },
  { value: "xls", label: "XLS", icon: "📈" },
  { value: "xlsx", label: "XLSX", icon: "📈" },
  { value: "video", label: "Video", icon: "🎬" },
  { value: "link", label: "Link", icon: "🔗" },
  { value: "other", label: "Other", icon: "📦" },
];

const ACCESS_LEVELS = [
  { value: "public", label: "Public", icon: Globe, desc: "Anyone can access" },
  { value: "private", label: "Private", icon: Lock, desc: "Only you can access" },
  { value: "program-only", label: "Program Only", icon: Users, desc: "Program members only" },
];

const SectionHeader = ({ icon: IconComponent, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
      {React.createElement(IconComponent, { size: 18 })}
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

const InputField = ({ label, name, type = "text", placeholder, validation, helperText, register, errors }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={name} className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {label} {validation?.required && <span className="text-orange-500">*</span>}
    </label>
    <input
      id={name}
      type={type}
      {...register(name, validation)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-gray-800/60 border transition-all duration-200 outline-none
        ${errors[name]
          ? "border-red-400 ring-2 ring-red-100 dark:ring-red-900/30"
          : "border-slate-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20"}
        text-slate-800 dark:text-gray-100 placeholder:text-slate-300 dark:placeholder:text-gray-600`}
    />
    {helperText && !errors[name] && <p className="text-xs text-slate-400">{helperText}</p>}
    {errors[name] && <p className="text-xs text-red-500 font-medium">{errors[name].message}</p>}
  </div>
);

const ResourceForm = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const user = useSelector((state) => state.auth?.user);
  const roleName = getRoleName(user);
  const shouldScopePrograms = /^(teacher|volunteer|library staff)$/.test(roleName) && !isAdminRoleName(roleName);

  const [dragOver, setDragOver] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState("");
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const fileInputRef = useRef(null);

  const { data: programsData = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["programs", { mine: shouldScopePrograms }],
    queryFn: async () => {
      const resp = await api.get("/programs", {
        params: { page: 1, limit: 200, ...(shouldScopePrograms ? { mine: "true" } : {}) },
      });
      return resp.data?.data ?? [];
    },
    staleTime: 30_000,
    retry: false,
  });

  const programOptions = useMemo(() => {
    const arr = Array.isArray(programsData) ? programsData : [];
    return arr.map((p) => ({ value: p._id, label: p.title }));
  }, [programsData]);

  const { data: fetchedResource, isLoading: isFetchingResource } = useQuery({
    queryKey: ["resource", id],
    enabled: isEditMode,
    queryFn: async () => {
      const resp = await api.get(`/resources/${id}`);
      return resp.data?.data ?? resp.data;
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const resp = await api.post("/resources", formData);
      return resp.data?.data ?? resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-resources"] });
      toast.success("Resource created successfully.");
      reset();
      navigate("/dashboard/resources");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create resource"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ resourceId, formData }) => {
      const resp = await api.put(`/resources/${resourceId}`, formData);
      return resp.data?.data ?? resp.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-resources"] });
      qc.invalidateQueries({ queryKey: ["resource", id] });
      toast.success("Resource updated successfully.");
      navigate("/dashboard/resources");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update resource"),
  });

  const isProcessing = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      type: "pdf",
      category: "",
      accessLevel: "public",
      programId: "",
      fileUrl: "",
      file: null,
    },
  });

  useEffect(() => {
    if (isEditMode && fetchedResource) {
      reset({
        title: fetchedResource.title || "",
        description: fetchedResource.description || "",
        type: fetchedResource.type || "pdf",
        category: fetchedResource.category || "",
        accessLevel: fetchedResource.accessLevel || "public",
        programId: fetchedResource.programId?._id || fetchedResource.programId || "",
        fileUrl: fetchedResource.fileUrl || "",
        file: null,
      });
      setCurrentFileUrl(fetchedResource.fileUrl || "");
      setSelectedUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isEditMode, fetchedResource, reset]);

  const watchedType = watch("type");
  const watchedAccessLevel = watch("accessLevel");
  const watchedFileUrl = watch("fileUrl");
  const selectedFile = selectedUploadFile;
  const fileRegistration = register("file");

  const selectUploadFile = (file, files) => {
    if (!file) return;
    setSelectedUploadFile(file);
    if (files) setValue("file", files, { shouldValidate: true, shouldDirty: true });
    setValue("fileUrl", "", { shouldValidate: true, shouldDirty: true });
  };

  const onDropFile = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    selectUploadFile(dropped, e.dataTransfer.files);
  };

  const onFileInputChange = (e) => {
    fileRegistration.onChange(e);
    const picked = e.target.files?.[0];
    if (!picked) return;
    selectUploadFile(picked, e.target.files);
  };

  const removeSelectedFile = () => {
    setSelectedUploadFile(null);
    setValue("file", null, { shouldValidate: true, shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFilePicker = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const onSubmitHandler = async (data) => {
    const formData = new FormData();
    const appendIfPresent = (key, value) => {
      if (value === undefined || value === null) return;
      if (typeof value === "string" && value.trim() === "") return;
      formData.append(key, value);
    };

    appendIfPresent("title", data.title);
    appendIfPresent("description", data.description);
    appendIfPresent("type", data.type);
    appendIfPresent("category", data.category);
    appendIfPresent("accessLevel", data.accessLevel);
    appendIfPresent("programId", data.programId);

    const file = selectedUploadFile || data.file?.[0];
    const hasFile = Boolean(file);
    const hasUrl = Boolean(data.fileUrl?.trim());
    const hasExistingFileInEdit = Boolean(isEditMode && currentFileUrl);

    if (!hasFile && !hasUrl && !hasExistingFileInEdit) {
      toast.error("Please upload a file or provide a file URL.");
      return;
    }

    if (hasFile) formData.append("file", file, file.name);
    else if (hasUrl) appendIfPresent("fileUrl", data.fileUrl.trim());

    try {
      if (isEditMode) await updateMutation.mutateAsync({ resourceId: id, formData });
      else await createMutation.mutateAsync(formData);
    } catch (err) {
      console.error(err);
    }
  };

  if (isEditMode && isFetchingResource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-orange-500" size={32} />
          <p className="text-sm text-slate-500">Loading resource details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-slate-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/resources")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-2"
            >
              <ChevronLeft size={14} /> Back to Resources
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isEditMode ? "Edit Resource" : "New Resource"}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEditMode ? "Update the resource details below." : "Fill in all sections and save when ready."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitHandler)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN — main info */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Section 1 — Resource Info */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
                <SectionHeader icon={FileText} title="Resource Information" subtitle="Basic details about this resource" />
                <div className="flex flex-col gap-5">
                  <InputField
                    label="Title"
                    name="title"
                    placeholder="e.g. Introduction to Machine Learning"
                    validation={{ required: "Title is required." }}
                    register={register}
                    errors={errors}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Category"
                      name="category"
                      placeholder="e.g. Data Science"
                      register={register}
                      errors={errors}
                    />
                    {/* Type picker */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Type <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          {...register("type", { required: "Type is required." })}
                          className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 text-slate-800 dark:text-gray-100 appearance-none outline-none transition-all"
                        >
                          {RESOURCE_TYPES.map((rt) => (
                            <option key={rt.value} value={rt.value}>
                              {rt.icon} {rt.label}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                      </div>
                      {errors.type && <p className="text-xs text-red-500 font-medium">{errors.type.message}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      {...register("description")}
                      placeholder="Briefly describe what this resource covers…"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/20 text-slate-800 dark:text-gray-100 placeholder:text-slate-300 dark:placeholder:text-gray-600 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 — File Upload */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
                <SectionHeader icon={FolderOpen} title="File or URL" subtitle="Upload a file or provide a direct link" />

                <input
                  type="file"
                  name={fileRegistration.name}
                  onBlur={fileRegistration.onBlur}
                  ref={(node) => {
                    fileRegistration.ref(node);
                    fileInputRef.current = node;
                  }}
                  onChange={onFileInputChange}
                  disabled={isProcessing}
                  className="fixed -left-[9999px] top-0 h-px w-px opacity-0"
                  tabIndex={-1}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onDrop={onDropFile}
                  className={`rounded-xl border-2 border-dashed p-7 text-center transition-all cursor-pointer
                    ${dragOver
                      ? "border-orange-500 bg-orange-50/70 dark:bg-orange-900/10"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/10"
                      : "border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/30 hover:border-orange-300 hover:bg-orange-50/30"
                    }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                        <FileText size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 max-w-[220px] truncate">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedFile();
                        }}
                        className="ml-2 w-7 h-7 rounded-full bg-slate-100 dark:bg-gray-700 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="mx-auto mb-3 text-slate-300 dark:text-gray-600" size={32} />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop your file here</p>
                      <p className="text-xs text-slate-400 mt-0.5 mb-3">PDF, DOCX, PPTX, Video, and more</p>
                      <button
                        type="button"
                        onClick={openFilePicker}
                        disabled={isProcessing}
                        className="inline-flex px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        Browse File
                      </button>
                    </>
                  )}
                </div>

                {!selectedFile && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                      <span className="text-xs text-slate-400 font-medium">or use a URL</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-gray-700" />
                    </div>
                    <InputField
                      label="File URL"
                      name="fileUrl"
                      type="url"
                      placeholder="https://example.com/resource.pdf"
                      helperText={isEditMode && currentFileUrl ? `Current: ${currentFileUrl}` : undefined}
                      register={register}
                      errors={errors}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN — access + program + summary */}
            <div className="flex flex-col gap-6">

              {/* Access Level */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
                <SectionHeader icon={Shield} title="Access Level" subtitle="Who can see this resource" />
                <div className="flex flex-col gap-2">
                  {ACCESS_LEVELS.map(({ value, label, icon: AccessIcon, desc }) => {
                    const isSelected = watchedAccessLevel === value;
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150
                          ${isSelected
                            ? "border-orange-400 bg-orange-50 dark:bg-orange-900/15"
                            : "border-slate-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800"
                          }`}
                      >
                        <input
                          type="radio"
                          value={value}
                          {...register("accessLevel", { required: true })}
                          className="hidden"
                        />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                          ${isSelected ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-gray-800 text-slate-400"}`}>
                          {React.createElement(AccessIcon, { size: 15 })}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-orange-700 dark:text-orange-300" : "text-slate-700 dark:text-slate-200"}`}>{label}</p>
                          <p className="text-xs text-slate-400">{desc}</p>
                        </div>
                        {isSelected && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Program Link */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
                <SectionHeader icon={LinkIcon} title="Linked Program" subtitle="Optional: attach to a program" />
                <div className="relative">
                  <select
                    {...register("programId")}
                    disabled={isLoadingPrograms}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-slate-800 dark:text-gray-100 appearance-none outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">No program</option>
                    {programOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</span>
                </div>
                {isLoadingPrograms && <p className="text-xs text-slate-400 mt-1.5">Loading programs…</p>}
              </div>

              {/* Summary card */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-2xl border border-orange-200/60 dark:border-orange-800/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Summary</p>
                <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Title</span>
                    <span className="font-semibold max-w-[120px] truncate text-right">{watch("title") || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type</span>
                    <span className="font-semibold">{watchedType?.toUpperCase() || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Access</span>
                    <span className="font-semibold capitalize">{watchedAccessLevel || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File</span>
                    <span className="font-semibold text-right max-w-[120px] truncate">
                      {selectedFile ? selectedFile.name : watchedFileUrl ? "URL" : currentFileUrl ? "Existing" : "None"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isEditMode ? "Update Resource" : "Save Resource"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceForm;
