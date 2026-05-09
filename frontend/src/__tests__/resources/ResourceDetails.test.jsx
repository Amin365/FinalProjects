import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { renderWithProviders } from "../../test/renderWithProviders";
import ResourceDetails from "../../components/Resources/ResourceDetails";

vi.mock("../../app/api/apislice", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../components/ExtraComponents/DocumentViewer", () => ({
  default: ({ docs }) => (
    <div data-testid="document-viewer">
      {docs?.[0]?.uri}
    </div>
  ),
}));

import api from "../../app/api/apislice";

const RESOURCE_ID = "69ff9373a401317a8c181540";

const renderPage = (resource) => {
  api.get.mockResolvedValueOnce({ data: { data: resource } });
  return renderWithProviders(
    <Routes>
      <Route path="/dashboard/resources/:id" element={<ResourceDetails />} />
    </Routes>,
    { initialPath: `/dashboard/resources/${RESOURCE_ID}` }
  );
};

describe("ResourceDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens PDF preview through the backend inline file endpoint", async () => {
    const user = userEvent.setup();
    renderPage({
      _id: RESOURCE_ID,
      title: "Library Rules",
      type: "pdf",
      fileUrl: "/uploads/resources/library-rules.pdf",
      accessLevel: "public",
      createdAt: "2026-05-09T00:00:00.000Z",
      downloads: 0,
      uploadedBy: { first_name: "Admin", last_name: "User", email: "admin@example.com" },
    });

    await screen.findByRole("heading", { name: "Library Rules" });
    await user.click(screen.getByRole("button", { name: /preview/i }));

    expect(await screen.findByTestId("document-viewer")).toHaveTextContent(
      `http://localhost:5000/api/resources/${RESOURCE_ID}/file`
    );
  });

  it("opens video preview with a playable video element", async () => {
    const user = userEvent.setup();
    renderPage({
      _id: RESOURCE_ID,
      title: "Welcome Video",
      type: "video",
      fileUrl: "https://cdn.example.com/welcome.mp4",
      accessLevel: "public",
      createdAt: "2026-05-09T00:00:00.000Z",
      downloads: 2,
      uploadedBy: { first_name: "Admin", last_name: "User", email: "admin@example.com" },
    });

    await screen.findByRole("heading", { name: "Welcome Video" });
    await user.click(screen.getByRole("button", { name: /preview/i }));

    const overlay = await screen.findByText("Welcome Video");
    const video = within(overlay.closest(".fixed")).getByText("video").closest(".fixed").querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "https://cdn.example.com/welcome.mp4");
  });
});
