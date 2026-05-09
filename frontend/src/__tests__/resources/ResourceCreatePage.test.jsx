import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/renderWithProviders";
import ResourceCreatePage from "../../components/Resources/ResourceCreatePage";

vi.mock("../../app/api/apislice", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import api from "../../app/api/apislice";

describe("ResourceCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [] } });
    api.post.mockResolvedValue({ data: { data: { _id: "resource-1" } } });
  });

  it("accepts files selected from the Browse File input and submits them as FormData", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ResourceCreatePage />, {
      initialPath: "/dashboard/resources/new",
    });

    await user.type(screen.getByLabelText(/title/i), "Resource PDF");
    const fileInput = container.querySelector('input[type="file"]');
    const pdf = new File(["%PDF-1.4"], "resource.pdf", { type: "application/pdf" });

    await user.upload(fileInput, pdf);

    expect(await screen.findByText("resource.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save resource/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/resources", expect.any(FormData));
    });

    const submitted = api.post.mock.calls[0][1];
    expect(submitted.get("title")).toBe("Resource PDF");
    expect(submitted.get("type")).toBe("pdf");
    expect(submitted.get("file")).toBe(pdf);
  });

  it("submits a URL resource when no file is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResourceCreatePage />, {
      initialPath: "/dashboard/resources/new",
    });

    await user.type(screen.getByLabelText(/title/i), "Remote Resource");
    await user.type(screen.getByLabelText(/file url/i), "https://example.com/guide.pdf");
    await user.click(screen.getByRole("button", { name: /save resource/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/resources", expect.any(FormData));
    });

    const submitted = api.post.mock.calls[0][1];
    expect(submitted.get("fileUrl")).toBe("https://example.com/guide.pdf");
    expect(submitted.get("file")).toBeNull();
  });
});
