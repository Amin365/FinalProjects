import Issue from "../models/Issue.js";

export const MAX_ACTIVE_ISSUES = 3;
export const MAX_BORROW_DAYS = 14;

/**
 * Check borrowing eligibility for a member.
 * Returns { allowed: boolean, reason: string | null }
 */
export async function checkBorrowingRules(memberId, { adminOverride = false } = {}) {
  if (adminOverride) return { allowed: true, reason: null };

  // Block if member has overdue items
  const overdueCount = await Issue.countDocuments({
    member: memberId,
    status: "Overdue",
  });

  if (overdueCount > 0) {
    return {
      allowed: false,
      reason: `You have ${overdueCount} overdue book(s). Please return them before borrowing again.`,
    };
  }

  // Block if member already has maximum active issues
  const activeCount = await Issue.countDocuments({
    member: memberId,
    status: "Issued",
  });

  if (activeCount >= MAX_ACTIVE_ISSUES) {
    return {
      allowed: false,
      reason: `Maximum active issues limit reached (${MAX_ACTIVE_ISSUES}). Please return a book before borrowing another.`,
    };
  }

  return { allowed: true, reason: null };
}
