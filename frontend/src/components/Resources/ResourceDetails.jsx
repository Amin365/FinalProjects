import React from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Eye,
  Calendar,
  FileText,
  Shield,
  Layers,
  HardDrive,
} from "lucide-react";
import api from "@/app/api/apislice";
import FilePreview from "@/components/ExtraComponents/FilePreview";

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: resource, isLoading, error } = useQuery({
    queryKey: ["resource-detail", id],
    queryFn: async () => {
      const res = await api.get(`/resources/${id}`);
      return res.data.data;
    },
  });


  const getInitials = (user) => {
    if (!user) return "U";
    return `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase();
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    const mb = bytes / 1024 / 1024;
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  const previewFile = React.useMemo(() => {
    const url = resource?.fileUrl;
    if (!url) return null;

    const rType = String(resource?.type || "").toLowerCase();
    const mimetype =
      rType === "pdf"
        ? "application/pdf"
        : rType === "doc"
          ? "application/msword"
          : rType === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : rType === "xls"
              ? "application/vnd.ms-excel"
              : rType === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : rType === "ppt"
                  ? "application/vnd.ms-powerpoint"
                  : rType === "pptx"
                    ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    : rType === "video"
                      ? "video/mp4"
                      : rType === "link"
                        ? "text/uri-list"
                        : "application/octet-stream";

    const fallbackName = String(url).split("/").pop() || "resource";
    return {
      filepath: url,
      filename: resource?.title || fallbackName,
      mimetype,
    };
  }, [resource]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-400">
        Loading resource…
      </div>
    );

  if (error || !resource)
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3 text-gray-500">
        <FileText size={36} />
        <p>Resource not found or removed.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm hover:text-black"
        >
          <ArrowLeft size={14} /> Go back
        </button>
      </div>
    );

  const stats = [
    {
      label: "Downloads",
      value: (resource.downloads ?? 0).toLocaleString(),
      icon: <Download size={14} />,
    },
    {
      label: "File Type",
      value: (resource.type || "Unknown").toUpperCase(),
      icon: <FileText size={14} />,
    },
    {
      label: "Date Added",
      value: formatDate(resource.createdAt),
      icon: <Calendar size={14} />,
    },
    {
      label: "Program",
      value: resource.programId?.title || "Global",
      icon: <Layers size={14} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black"
      >
        <ArrowLeft size={14} /> Resources
      </button>

      {/* Hero */}
      <div className="mt-8 flex justify-between items-start flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-500 font-semibold">
            Resource
          </p>
          <h1 className="text-3xl md:text-4xl font-serif mt-2">
            {resource.title}
          </h1>
        </div>

        <div className="flex gap-2">
          {previewFile ? (
            <FilePreview file={previewFile} selectedIndex={0} allFiles={[previewFile]}>
              <button
                type="button"
                className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm hover:bg-gray-100"
              >
                <Eye size={14} /> Preview
              </button>
            </FilePreview>
          ) : null}

          <button
            type="button"
            onClick={() => window.open(resource.fileUrl, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600"
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {stats.map((s, i) => (
          <div key={i} className="border rounded-xl p-4">
            <div className="mb-2 text-orange-500">{s.icon}</div>
            <p className="text-xs text-gray-400 uppercase">{s.label}</p>
            <p className="font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-[1fr_320px] gap-6 mt-8">

        {/* Description */}
        <div className="border rounded-xl">
          <div className="p-5 border-b font-semibold text-sm">
            About this resource
          </div>
          <div className="p-5 text-gray-600 text-sm leading-relaxed">
            {resource.description || "No description provided."}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">

          {/* Download Card */}
          <div className="border rounded-xl p-5">
            <h3 className="font-semibold mb-2">Ready to use?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download and start using it immediately.
            </p>
            <button className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 flex items-center justify-center gap-2">
              <Download size={14} /> Download File
            </button>
          </div>

          {/* Metadata */}
          <div className="border rounded-xl">
            <div className="p-4 border-b font-semibold text-sm">Metadata</div>

            <div className="p-4 flex justify-between text-sm">
              <span className="flex gap-2 text-gray-500">
                <Shield size={14} /> Access
              </span>
              <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs">
                {resource.accessLevel || "Public"}
              </span>
            </div>

            <div className="p-4 flex justify-between text-sm border-t">
              <span className="flex gap-2 text-gray-500">
                <HardDrive size={14} /> Size
              </span>
              <span>{formatSize(resource.size)}</span>
            </div>
          </div>

          {/* Uploader */}
          <div className="border rounded-xl">
            <div className="p-4 border-b font-semibold text-sm">
              Uploaded by
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                {resource.uploadedBy.profile_picture ? (
                  <img
                    src={resource.uploadedBy.profile_picture}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-orange-600 font-semibold">
                    {getInitials(resource.uploadedBy)}
                  </span>
                )}
              </div>

              <div>
                <p className="font-semibold text-sm">
                  {resource.uploadedBy?.first_name
                    ? `${resource.uploadedBy.first_name} ${resource.uploadedBy.last_name || ""}`
                    : "System Admin"}
                </p>
                <p className="text-xs text-gray-400">
                  {resource.uploadedBy?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;