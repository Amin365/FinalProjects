import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router";
import { renderWithProviders } from "../test/renderWithProviders";
import ProtectedRoute from "../pages/ProtectedRoute";

// Mock api so no real HTTP requests are made
vi.mock("../app/api/apislice", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "../app/api/apislice";

const ChildComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

/**
 * Wrap ProtectedRoute inside a Routes/Route tree so that
 * the <Navigate to="/login"> redirect finds a matching route
 * rather than triggering an infinite re-render loop.
 */
function TestApp({ children }) {
  return (
    <Routes>
      <Route
        path="/"
        element={<ProtectedRoute>{children}</ProtectedRoute>}
      />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login when there is no token in the store", async () => {
    renderWithProviders(
      <TestApp>
        <ChildComponent />
      </TestApp>,
      {
        initialPath: "/",
        preloadedState: { auth: { user: null, token: null, IsAuthenticated: false } },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  it("renders children when the user is already in the store", async () => {
    const mockUser = {
      _id: "u1",
      username: "alice",
      email: "alice@test.com",
      permissions: [],
    };

    api.get.mockResolvedValue({ data: { user: mockUser } });

    renderWithProviders(
      <TestApp>
        <ChildComponent />
      </TestApp>,
      {
        initialPath: "/",
        preloadedState: {
          auth: { user: mockUser, token: "valid-token", IsAuthenticated: true },
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("redirects to /login when the API call fails", async () => {
    api.get.mockRejectedValue(new Error("Unauthorized"));

    renderWithProviders(
      <TestApp>
        <ChildComponent />
      </TestApp>,
      {
        initialPath: "/",
        preloadedState: {
          auth: { user: null, token: "expired-token", IsAuthenticated: false },
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });
});
