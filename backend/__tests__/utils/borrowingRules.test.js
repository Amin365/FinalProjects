import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Issue model before importing the module under test
vi.mock("../../models/Issue.js", () => ({
  default: {
    countDocuments: vi.fn(),
  },
}));

import Issue from "../../models/Issue.js";
import {
  checkBorrowingRules,
  MAX_ACTIVE_ISSUES,
  MAX_BORROW_DAYS,
} from "../../utility/borrowingRules.js";

describe("borrowingRules constants", () => {
  it("exports MAX_ACTIVE_ISSUES of 3", () => {
    expect(MAX_ACTIVE_ISSUES).toBe(3);
  });

  it("exports MAX_BORROW_DAYS of 14", () => {
    expect(MAX_BORROW_DAYS).toBe(14);
  });
});

describe("checkBorrowingRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("immediately allows when adminOverride is true without querying DB", async () => {
    const result = await checkBorrowingRules("member123", { adminOverride: true });
    expect(result).toEqual({ allowed: true, reason: null });
    expect(Issue.countDocuments).not.toHaveBeenCalled();
  });

  it("blocks borrowing when member has overdue items", async () => {
    // First call: overdue count = 2, second call (active) should not be reached
    Issue.countDocuments.mockResolvedValueOnce(2);

    const result = await checkBorrowingRules("member123");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/overdue/i);
  });

  it("blocks borrowing when member has reached the active issue limit", async () => {
    // overdue = 0, active = MAX_ACTIVE_ISSUES
    Issue.countDocuments
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(MAX_ACTIVE_ISSUES);

    const result = await checkBorrowingRules("member123");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/maximum/i);
  });

  it("allows borrowing when member has no overdue items and is below the active limit", async () => {
    Issue.countDocuments
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(MAX_ACTIVE_ISSUES - 1);

    const result = await checkBorrowingRules("member123");
    expect(result).toEqual({ allowed: true, reason: null });
  });

  it("allows borrowing when member has zero active issues", async () => {
    Issue.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const result = await checkBorrowingRules("member123");
    expect(result).toEqual({ allowed: true, reason: null });
  });
});
