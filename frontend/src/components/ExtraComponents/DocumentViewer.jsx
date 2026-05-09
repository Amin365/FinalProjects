import React, { useMemo, useState } from "react";
import {
  Worker,
  Viewer,
  SpecialZoomLevel,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { toolbarPlugin } from "@react-pdf-viewer/toolbar";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

import { Button } from "@/components/ui/button";

// ✅ IMPORTANT (Vite local worker)
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

// Simple spinner
function Spinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
    </div>
  );
}

export default function DocumentViewer({
  docs = [],
  index = 0,
  preview = true,
  minPdfWidth = 700,
}) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [loading, setLoading] = useState(true);

  const doc = docs?.[activeIndex];

  const fileType = useMemo(() => {
    const rawType = String(doc?.fileType || "").toLowerCase();
    const normalizedTypes = {
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/ogg": "ogg",
      "video/quicktime": "mov",
    };

    if (normalizedTypes[rawType]) return normalizedTypes[rawType];
    if (rawType.includes("/")) return rawType.split("/").pop();
    if (rawType) return rawType;

    try {
      const pathName = new URL(doc?.uri || "", window.location.href).pathname;
      const ext = decodeURIComponent(pathName).split(".").pop();
      return ext && ext !== pathName ? ext.toLowerCase() : "";
    } catch {
      const clean = String(doc?.uri || "").split("?")[0].split("#")[0];
      const ext = clean.split(".").pop();
      return ext && ext !== clean ? ext.toLowerCase() : "";
    }
  }, [doc]);

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType);
  const isPdf = fileType === "pdf";
  const isOffice = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileType);
  const isVideo = ["mp4", "webm", "ogg"].includes(fileType);

  // Plugins
  const toolbarPluginInstance = toolbarPlugin();
  const { renderDefaultToolbar } = toolbarPluginInstance;

  const transform = (slot) => ({
    ...slot,
    Download: () => <></>,
    Open: () => <></>,
    Print: () => <></>,
  });

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [defaultTabs[0], defaultTabs[1]],
    renderToolbar: (Toolbar) => (
      <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
    ),
  });

  const handlePrev = () => {
    if (activeIndex <= 0) return;
    setLoading(true);
    setActiveIndex((i) => i - 1);
  };
  const handleNext = () => {
    if (activeIndex >= docs.length - 1) return;
    setLoading(true);
    setActiveIndex((i) => i + 1);
  };

  if (!doc?.uri) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        No document to preview.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {/* Loading overlay for non-PDF previews. PDF has its own loader/error UI. */}
        {loading && !isPdf && (
          <div className="absolute inset-0 z-10 bg-white/70">
            <Spinner />
          </div>
        )}

        {/* IMAGE */}
        {isImage && (
          <img
            src={doc.uri}
            alt={doc.fileName || "document-image"}
            onLoad={() => setLoading(false)}
            className="max-h-[70vh] w-auto max-w-full rounded-md border object-contain"
          />
        )}

        {/* PDF */}
        {isPdf && (
          <Worker workerUrl={pdfWorker}>
            <div
              className="rounded-md border bg-white"
              style={{
                width: minPdfWidth,
                height: "70vh",
                maxWidth: "100%",
              }}
            >
              <Viewer
                fileUrl={doc.uri}
                plugins={[defaultLayoutPluginInstance]}
                defaultScale={SpecialZoomLevel.PageWidth}
                onDocumentLoad={() => setLoading(false)}
                renderLoader={() => <Spinner />}
                renderError={(loadError) => (
                  <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-md bg-white p-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">Unable to preview this PDF here.</p>
                    <p className="max-w-md text-xs text-slate-500">
                      {loadError?.message || "The file server may be blocking inline PDF reading."}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.uri, "_blank", "noopener,noreferrer")}
                    >
                      Open PDF
                    </Button>
                  </div>
                )}
              />
            </div>
          </Worker>
        )}

        {/* OFFICE */}
        {isOffice && (
          <iframe
            title={doc.fileName || "office-document"}
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
              doc.uri
            )}`}
            className="h-[70vh] w-full rounded-md border"
            onLoad={() => setLoading(false)}
          />
        )}

        {/* VIDEO */}
        {isVideo && (
          <video
            controls
            className="h-[70vh] w-full rounded-md border"
            onLoadedData={() => setLoading(false)}
          >
            <source src={doc.uri} type={`video/${fileType}`} />
          </video>
        )}

        {/* FALLBACK */}
        {!isImage && !isPdf && !isOffice && !isVideo && (
          <iframe
            title={doc.fileName || "document"}
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(
              doc.uri
            )}&embedded=true`}
            className="h-[70vh] w-full rounded-md border"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>

      {/* Navigation */}
      {docs.length > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrev}
            disabled={activeIndex === 0}
          >
            Previous
          </Button>

          <div className="text-xs text-muted-foreground">
            {activeIndex + 1} / {docs.length}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleNext}
            disabled={activeIndex === docs.length - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
