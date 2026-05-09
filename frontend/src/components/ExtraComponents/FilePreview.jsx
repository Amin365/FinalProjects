import React, { useCallback, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  FilePieChart,
  FileArchive,
  File,
  Image as ImageIcon,
  Play,
  Music,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import DocumentViewer from "./DocumentViewer";

function getCategoryFromMime(mimetype) {
  const [type, subtype] = (mimetype || "").split("/");
  return { type, subtype };
}

function getFileIconBySubtype(subtype) {
  const s = (subtype || "").toLowerCase();

  if (s === "pdf") return { Icon: FileText, className: "text-red-600" };

  if (
    ["doc", "docx", "msword", "vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
      s
    )
  )
    return { Icon: FileText, className: "text-blue-600" };

  if (
    ["xls", "xlsx", "vnd.ms-excel", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(
      s
    )
  )
    return { Icon: FileSpreadsheet, className: "text-green-700" };

  if (
    ["ppt", "pptx", "vnd.ms-powerpoint", "vnd.openxmlformats-officedocument.presentationml.presentation"].includes(
      s
    )
  )
    return { Icon: FilePieChart, className: "text-orange-600" };

  if (["zip", "7z", "rar", "x-7z-compressed", "x-rar-compressed"].includes(s))
    return { Icon: FileArchive, className: "text-purple-600" };

  return { Icon: File, className: "text-slate-600" };
}

export default function FilePreview({ file, selectedIndex = 0, allFiles = [], children }) {
  const videoRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState("video"); // "video" | "document" | "image"

  const { type, subtype: ext } = getCategoryFromMime(file?.mimetype);

  const showDocPreview = useMemo(() => {
    const e = (ext || "").toLowerCase();
    return (
      e === "pdf" ||
      ["doc", "docx", "msword", "vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(e) ||
      ["xls", "xlsx", "vnd.ms-excel", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(e) ||
      ["ppt", "pptx", "vnd.ms-powerpoint", "vnd.openxmlformats-officedocument.presentationml.presentation"].includes(e)
    );
  }, [ext]);

  const openPreview = useCallback(() => {
    const filePath = file?.filepath;
    if (!filePath) return;

    if (type === "image") {
      setActiveOverlay("image");
      setOpen(true);
      return;
    }
    if (type === "video") {
      setActiveOverlay("video");
      setOpen(true);
      return;
    }
    if (type === "audio") {
      setActiveOverlay("audio");
      setOpen(true);
      return;
    }
    if (showDocPreview) {
      setActiveOverlay("document");
      setOpen(true);
      return;
    }

    window.open(filePath, "_blank", "noopener,noreferrer");
  }, [file, showDocPreview, type]);

  async function downloadFile(filePath = file?.filepath, fileName = file?.filename) {
    if (!filePath) return;
    const res = await axios.get(filePath, { responseType: "blob" });
    const href = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }

  // Docs list for DocumentViewer (normalize keys)
  const docs = useMemo(() => {
    return (allFiles || []).map((fl) => {
      let fileType = fl?.fileType || fl?.mimetype?.split("/")?.[1];
      if (fileType === "vnd.openxmlformats-officedocument.wordprocessingml.document") fileType = "docx";
      if (fileType === "vnd.openxmlformats-officedocument.spreadsheetml.sheet") fileType = "xlsx";
      if (fileType === "vnd.openxmlformats-officedocument.presentationml.presentation") fileType = "pptx";
      if (fileType === "msword") fileType = "doc";
      if (fileType === "vnd.ms-excel") fileType = "xls";
      if (fileType === "vnd.ms-powerpoint") fileType = "ppt";
      return {
        uri: fl?.uri ?? fl?.filepath,
        fileName: fl?.fileName ?? fl?.filename,
        fileType,
      };
    });
  }, [allFiles]);

  //  Renderers 
  const FileName = () => (
    <span className="truncate max-w-[140px] text-sm">{file?.filename}</span>
  );

  const trigger = useMemo(() => {
    if (!file) return null;
    if (!children) return null;

    if (React.isValidElement(children)) {
      const existingOnClick = children.props?.onClick;
      return React.cloneElement(children, {
        onClick: (e) => {
          existingOnClick?.(e);
          if (e?.defaultPrevented) return;
          openPreview();
        },
      });
    }

    return (
      <span
        role="button"
        tabIndex={0}
        onClick={openPreview}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPreview();
          }
        }}
      >
        {children}
      </span>
    );
  }, [children, file, openPreview]);

  return (
    <TooltipProvider>
      <div className="w-fit">
        {trigger}

        {/* IMAGE */}
        {!trigger && type === "image" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  setActiveOverlay("image");
                  setOpen(true);
                }}
                className="relative inline-flex h-12 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted"
                title={file?.filename}
              >
                <img
                  src={file?.filepath}
                  alt={file?.filename || "image"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  <ImageIcon className="h-3 w-3" />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{file?.filename}</TooltipContent>
          </Tooltip>
        ) : null}

        {/* VIDEO */}
        {!trigger && type === "video" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  setActiveOverlay("video");
                  setOpen(true);
                }}
                className="relative inline-flex w-24 items-center justify-center overflow-hidden rounded-md border bg-black"
                title={file?.filename}
              >
                <video
                  key={file?.filepath}
                  src={file?.filepath}
                  ref={videoRef}
                  className="h-14 w-24 object-cover opacity-80"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-6 w-6 text-white/80" />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>{file?.filename}</TooltipContent>
          </Tooltip>
        ) : null}

        {/* AUDIO */}
        {!trigger && type === "audio" ? (
          <div className="flex max-w-[320px] flex-col gap-2 rounded-md border bg-background p-2">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate text-sm">{file?.filename}</span>
                </TooltipTrigger>
                <TooltipContent>{file?.filename}</TooltipContent>
              </Tooltip>
            </div>
            <audio controls className="w-full">
              <source src={file?.filepath} type={file?.mimetype} />
              Your browser does not support the audio element.
            </audio>
          </div>
        ) : null}

        {/* OTHER FILE TYPES */}
        {!trigger && type !== "image" && type !== "video" && type !== "audio" ? (
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-2 py-2">
            {(() => {
              const { Icon, className } = getFileIconBySubtype(ext);
              return <Icon className={`h-5 w-5 ${className}`} />;
            })()}

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0">
                  <FileName />
                </div>
              </TooltipTrigger>
              <TooltipContent>{file?.filename}</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => downloadFile()}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>

              {showDocPreview ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setActiveOverlay("document");
                        setOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* DIALOG (replaces OverlayPanel) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="truncate">
                {activeOverlay === "document" ? "Document preview" : file?.filename}
              </DialogTitle>
            </DialogHeader>

            {activeOverlay === "video" ? (
              <video
                key={file?.filepath}
                src={file?.filepath}
                controls
                autoPlay
                className="w-full rounded-md"
              />
            ) : null}

            {activeOverlay === "audio" ? (
              <audio controls autoPlay className="w-full">
                <source src={file?.filepath} type={file?.mimetype} />
                Your browser does not support the audio element.
              </audio>
            ) : null}

            {activeOverlay === "image" ? (
              <div className="flex max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-md bg-black">
                <img
                  src={file?.filepath}
                  alt={file?.filename || "image"}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>
            ) : null}

            {activeOverlay === "document" ? (
              <DocumentViewer docs={docs} index={selectedIndex} preview={false} />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
