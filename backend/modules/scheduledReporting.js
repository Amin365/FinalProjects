/**
 * Phase 5 - Scheduled Reporting Module
 * Auto-generates weekly/monthly summary reports and notifies admins.
 */

import cron from "node-cron";
// import DailyReport from "../models/DailyReport.js";
import Member from "../models/Members.js";
import User from "../models/user.js";
import Role from "../models/Role.js";
import Notification from "../models/Notification.js";

/**
 * Generate summary report data for a given period
 * @param {"weekly"|"monthly"} period
 */
async function generateSummaryReport(period) {
  const now = new Date();
  let fromDate;

  if (period === "monthly") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 7);
  }

  const matchStage = { readingDate: { $gte: fromDate, $lte: now } };

  // const [reportStats, topReaders, activeMembers] = await Promise.all([
  //   DailyReport.aggregate([
  //     { $match: matchStage },
  //     {
  //       $group: {
  //         _id: null,
  //         totalReports: { $sum: 1 },
  //         approvedReports: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
  //         pendingReports: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
  //         pagesRead: { $sum: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] } },
  //         minutesRead: { $sum: "$timeSpent" },
  //         avgRating: { $avg: "$rating" },
  //         uniqueReaders: { $addToSet: "$createdBy" },
  //       },
  //     },
  //   ]),
  //   DailyReport.aggregate([
  //     { $match: matchStage },
  //     {
  //       $group: {
  //         _id: "$createdBy",
  //         reportsCount: { $sum: 1 },
  //         pagesRead: { $sum: { $max: [0, { $subtract: ["$pagesTo", "$pagesFrom"] }] } },
  //       },
  //     },
  //     { $sort: { reportsCount: -1 } },
  //     { $limit: 5 },
  //   ]),
  //   Member.countDocuments({ status: "Active", isArchived: false }),
  // ]);

  const stats = reportStats[0] || {
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    pagesRead: 0,
    minutesRead: 0,
    avgRating: 0,
    uniqueReaders: [],
  };

  // Enrich top readers with names
  const topReaderIds = topReaders.map((t) => t._id);
  const topUsers = await User.find({ _id: { $in: topReaderIds } })
    .select("first_name last_name")
    .lean();
  const userMap = new Map(topUsers.map((u) => [String(u._id), u]));

  const enrichedTopReaders = topReaders.map((t) => {
    const user = userMap.get(String(t._id));
    return {
      name: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "Unknown",
      reportsCount: t.reportsCount,
      pagesRead: t.pagesRead,
    };
  });

  return {
    period,
    dateRange: { from: fromDate.toISOString(), to: now.toISOString() },
    overview: {
      totalReports: stats.totalReports,
      approvedReports: stats.approvedReports,
      pendingReports: stats.pendingReports,
      pagesRead: stats.pagesRead,
      minutesRead: stats.minutesRead,
      avgRating: Math.round((stats.avgRating || 0) * 10) / 10,
      activeReaders: stats.uniqueReaders?.length || 0,
      totalActiveMembers: activeMembers,
      participationRate:
        activeMembers > 0
          ? Math.round(((stats.uniqueReaders?.length || 0) / activeMembers) * 100)
          : 0,
    },
    topReaders: enrichedTopReaders,
  };
}

/**
 * Notify super admins about the summary report
 */
async function notifySuperAdmins(summary) {
  try {
    const superAdminRole = await Role.findOne({
      $or: [
        { role: { $regex: "^Super Admin$", $options: "i" } },
        { plural: { $regex: "^Super Admins$", $options: "i" } },
      ],
    })
      .lean()
      .exec();

    if (!superAdminRole) {
      console.log("[Scheduled Report] No Super Admin role found");
      return;
    }

    const superAdmins = await User.find({ role: superAdminRole._id })
      .select("_id")
      .lean()
      .exec();

    if (!superAdmins || superAdmins.length === 0) {
      console.log("[Scheduled Report] No Super Admin users found");
      return;
    }

    const periodLabel = summary.period === "monthly" ? "Monthly" : "Weekly";
    const topReadersText = summary.topReaders
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.name} (${r.reportsCount} reports)`)
      .join(", ");

    const message = `${periodLabel} Summary: ${summary.overview.totalReports} reports submitted, ${summary.overview.pagesRead.toLocaleString()} pages read, ${summary.overview.activeReaders} active readers (${summary.overview.participationRate}% participation). Top readers: ${topReadersText || "None"}`;

    const notifDocs = superAdmins.map((sa) => ({
      user: sa._id,
      title: `📊 ${periodLabel} Reading Report Summary`,
      message,
      type: "info",
      meta: { kind: "scheduled-report", period: summary.period },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (notifDocs.length > 0) {
      await Notification.insertMany(notifDocs);
      console.log(`[Scheduled Report] ${periodLabel} summary sent to ${notifDocs.length} super admin(s)`);
    }
  } catch (err) {
    console.error("[Scheduled Report] Failed to notify super admins:", err);
  }
}

/**
 * Run the weekly report generation
 */
async function runWeeklyReport() {
  console.log("[Scheduled Report] Generating weekly summary...");
  try {
    const summary = await generateSummaryReport("weekly");
    await notifySuperAdmins(summary);
    console.log("[Scheduled Report] Weekly summary completed:", summary.overview);
  } catch (err) {
    console.error("[Scheduled Report] Weekly report failed:", err);
  }
}

/**
 * Run the monthly report generation
 */
async function runMonthlyReport() {
  console.log("[Scheduled Report] Generating monthly summary...");
  try {
    const summary = await generateSummaryReport("monthly");
    await notifySuperAdmins(summary);
    console.log("[Scheduled Report] Monthly summary completed:", summary.overview);
  } catch (err) {
    console.error("[Scheduled Report] Monthly report failed:", err);
  }
}

/**
 * Start the scheduled reporting cron jobs
 * - Weekly: Every Sunday at 8:00 AM
 * - Monthly: 1st day of each month at 8:00 AM
 */
export function startScheduledReporting() {
  // Weekly report: Every Sunday at 8:00 AM
  cron.schedule(
    "0 8 * * 0",
    () => {
      runWeeklyReport();
    },
    {
      scheduled: true,
      timezone: "Africa/Addis_Ababa", // Adjust to your timezone
    }
  );

  // Monthly report: 1st day of each month at 8:00 AM
  cron.schedule(
    "0 8 1 * *",
    () => {
      runMonthlyReport();
    },
    {
      scheduled: true,
      timezone: "Africa/Addis_Ababa", // Adjust to your timezone
    }
  );

  console.log("✅ Scheduled reporting started (weekly: Sundays 8AM, monthly: 1st of month 8AM)");
}

export { generateSummaryReport, notifySuperAdmins };
