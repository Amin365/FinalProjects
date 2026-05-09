import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DocumentViewer from "../../components/ExtraComponents/DocumentViewer";

vi.mock("@react-pdf-viewer/core", () => ({
  SpecialZoomLevel: { PageWidth: "PageWidth" },
  Worker: ({ children, workerUrl }) => <div data-worker-url={workerUrl}>{children}</div>,
  Viewer: ({ fileUrl, renderError }) => (
    <div data-testid="pdf-viewer">
      <span>{fileUrl}</span>
      <div data-testid="pdf-error">{renderError?.({ message: "Cannot load document" })}</div>
    </div>
  ),
}));

vi.mock("@react-pdf-viewer/default-layout", () => ({
  defaultLayoutPlugin: () => ({}),
}));

vi.mock("@react-pdf-viewer/toolbar", () => ({
  toolbarPlugin: () => ({
    renderDefaultToolbar: () => () => null,
  }),
}));

vi.mock("pdfjs-dist/build/pdf.worker?url", () => ({
  default: "/mock-pdf-worker.js",
}));

describe("DocumentViewer", () => {
  it("detects PDF files from MIME type and renders the PDF viewer", () => {
    render(
      <DocumentViewer
        docs={[
          {
            uri: "http://localhost:5000/api/resources/resource-id/file",
            fileName: "resource.pdf",
            fileType: "application/pdf",
          },
        ]}
      />
    );

    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent(
      "http://localhost:5000/api/resources/resource-id/file"
    );
  });

  it("shows a readable PDF error fallback instead of a blank white area", () => {
    render(
      <DocumentViewer
        docs={[
          {
            uri: "http://localhost:5000/api/resources/bad/file",
            fileName: "bad.pdf",
            fileType: "application/pdf",
          },
        ]}
      />
    );

    expect(screen.getByText("Unable to preview this PDF here.")).toBeInTheDocument();
    expect(screen.getByText("Cannot load document")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open pdf/i })).toBeInTheDocument();
  });
});
