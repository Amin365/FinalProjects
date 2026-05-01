import React, { useEffect, useMemo, useState } from "react";
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

  useEffect(() => setActiveIndex(index), [index]);

  const doc = docs?.[activeIndex];

  const fileType = useMemo(() => {
    const t = doc?.fileType || doc?.uri?.split(".").pop() || "";
    return String(t).toLowerCase();
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

  const handlePrev = () => activeIndex > 0 && setActiveIndex((i) => i - 1);
  const handleNext = () =>
    activeIndex < docs.length - 1 && setActiveIndex((i) => i + 1);

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
        {/* ✅ Loading overlay */}
        {loading && (
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
              className="rounded-md border"
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