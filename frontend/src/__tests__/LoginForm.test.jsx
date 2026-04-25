import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders";
import { LoginForm } from "../components/login/Login";

// Mock the API slice so no real HTTP requests are made
vi.mock("../app/api/apislice", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock sonner toast to avoid side-effects
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// Mock push notifications (requires browser APIs not available in jsdom)
vi.mock("../lib/notifications", () => ({
  enableNotifications: vi.fn().mockResolvedValue(undefined),
}));

import api from "../app/api/apislice";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form with identifier and password fields", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByPlaceholderText(/email@example.com or username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\*{4,}/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows validation error when identifier field is empty on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/email or username is required/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when password field is empty on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/email@example.com or username/i),
      "alice@test.com"
    );
    await user.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("calls the login API with correct credentials when form is valid", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "mock-token",
        user: { _id: "u1", username: "alice", email: "alice@test.com", permissions: [] },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(/email@example.com or username/i),
      "alice@test.com"
    );
    await user.type(screen.getByPlaceholderText(/\*{4,}/), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/auth/login",
        expect.objectContaining({
          identifier: "alice@test.com",
          password: "password123",
        })
      );
    });
  });

  it("shows an error message when the API returns an error", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Incorrect Credentials." } },
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText(/email@example.com or username/i),
      "wrong@test.com"
    );
    await user.type(screen.getByPlaceholderText(/\*{4,}/), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect credentials/i)).toBeInTheDocument();
    });
  });
});
