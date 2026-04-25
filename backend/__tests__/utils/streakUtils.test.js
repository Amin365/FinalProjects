import { describe, it, expect } from "vitest";
import { calcLongestStreak, calcPagesRead } from "../../utility/streakUtils.js";

describe("calcLongestStreak", () => {
  it("returns 0 for an empty array", () => {
    expect(calcLongestStreak([])).toBe(0);
  });

  it("returns 1 for a single date", () => {
    expect(calcLongestStreak(["2024-01-01"])).toBe(1);
  });

  it("returns 1 when all dates are the same day", () => {
    expect(calcLongestStreak(["2024-01-01", "2024-01-01", "2024-01-01"])).toBe(1);
  });

  it("calculates a consecutive streak correctly", () => {
    const dates = ["2024-01-01", "2024-01-02", "2024-01-03"];
    expect(calcLongestStreak(dates)).toBe(3);
  });

  it("returns the longest streak when there are gaps", () => {
    // streak of 3 (Jan 1-3), gap, streak of 2 (Jan 10-11)
    const dates = [
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
      "2024-01-10",
      "2024-01-11",
    ];
    expect(calcLongestStreak(dates)).toBe(3);
  });

  it("handles dates provided as Date objects", () => {
    const dates = [new Date("2024-03-01"), new Date("2024-03-02")];
    expect(calcLongestStreak(dates)).toBe(2);
  });

  it("deduplicates duplicate dates before computing", () => {
    // Two entries on the same day should not artificially extend the streak
    const dates = ["2024-01-01", "2024-01-01", "2024-01-02"];
    expect(calcLongestStreak(dates)).toBe(2);
  });

  it("returns correct streak when dates are unsorted", () => {
    const dates = ["2024-01-03", "2024-01-01", "2024-01-02"];
    expect(calcLongestStreak(dates)).toBe(3);
  });
});

describe("calcPagesRead", () => {
  it("returns the difference between pagesTo and pagesFrom", () => {
    expect(calcPagesRead({ pagesFrom: 10, pagesTo: 50 })).toBe(40);
  });

  it("returns 0 when pagesFrom and pagesTo are equal", () => {
    expect(calcPagesRead({ pagesFrom: 20, pagesTo: 20 })).toBe(0);
  });

  it("returns 0 when pagesFrom is greater than pagesTo", () => {
    expect(calcPagesRead({ pagesFrom: 50, pagesTo: 10 })).toBe(0);
  });

  it("returns 0 when both values are missing", () => {
    expect(calcPagesRead({})).toBe(0);
  });

  it("treats missing pagesFrom as 0", () => {
    expect(calcPagesRead({ pagesTo: 30 })).toBe(30);
  });

  it("treats missing pagesTo as 0, returning 0 (Math.max guard)", () => {
    expect(calcPagesRead({ pagesFrom: 10 })).toBe(0);
  });
});
