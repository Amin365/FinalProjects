import { describe, expect, it, vi } from "vitest";
import { requirePermission, requireRoleOrPermission } from "../../middleware/role.js";

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe("role and permission middleware", () => {
  it("allows a user who has any required permission", async () => {
    const req = { user: { permissions: ["Manage Resource"] } };
    const res = makeRes();
    const next = vi.fn();

    await requirePermission(["Manage Members", "manage resource"])(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("requires every permission when requireAll is true", async () => {
    const req = { user: { permissions: ["Manage Resource"] } };
    const res = makeRes();
    const next = vi.fn();

    await requirePermission(["Manage Resource", "Manage Members"], { requireAll: true })(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Insufficient permissions",
        required: ["Manage Resource", "Manage Members"],
      })
    );
  });

  it("allows super admin role even when the specific permission is missing", async () => {
    const req = { user: { role: { role: "Super Admin" }, permissions: [] } };
    const res = makeRes();
    const next = vi.fn();

    await requireRoleOrPermission(["admin", "super admin"], ["Manage Resource"])(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows permission fallback when role is not in the allowed list", async () => {
    const req = { user: { role: { role: "Teacher" }, permissions: ["Manage Resource"] } };
    const res = makeRes();
    const next = vi.fn();

    await requireRoleOrPermission(["admin", "super admin"], ["Manage Resource"])(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects users who match neither role nor permission", async () => {
    const req = { user: { role: { role: "Member" }, permissions: ["View Books"] } };
    const res = makeRes();
    const next = vi.fn();

    await requireRoleOrPermission(["admin", "super admin"], ["Manage Resource"])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
  });
});
