import mongoose from "mongoose";
import DailyReport from "../models/DailyReport.js";
import User from "../models/user.js";
import Notification from "../models/Notification.js";
import Role from "../models/Role.js";
import { sendPushToUser } from "../utility/push.js";

/* 
   DATE UTILS (UTC SAFE)
 */

function toUTCDateOnly(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function getYesterdayUTC(date) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

/* 
   MAIN NOTIFICATION LOGIC
 */

export async function notifyUsersMissingDailyReport() {
  const today = toUTCDateOnly(new Date());
  const yesterday = getYesterdayUTC(today);
  const todayEnd = new Date(today);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);
  todayEnd.setUTCMilliseconds(todayEnd.getUTCMilliseconds() - 1);

  const membersRole = await Role.findOne({ role: /^(members|member)$/i })
    .select("_id")
    .lean();

  if (!membersRole?._id) return;

  // Get all member IDs that are linked to users
  const memberIds = await User.distinct("member", {
    member: { $ne: null },
  });

  for (const memberId of memberIds) {
    // Get all users under this member
    const users = await User.find({ member: memberId, role: membersRole._id })
      .select("_id first_name last_name email role")
      .lean();

    if (!users.length) continue;

    // Check if ANY user submitted report today or yesterday
    const hasRecentReport = await DailyReport.exists({
      createdBy: { $in: users.map((u) => u._id) },
      readingDate: { $gte: yesterday, $lte: todayEnd },
    });

    if (hasRecentReport) continue;

    // Notify users
    for (const user of users) {
      // Avoid duplicate notification
      const alreadyNotified = await Notification.exists({
        user: user._id,
        "meta.kind": "missed-daily-report",
        "meta.forDate": today,
      });

      if (alreadyNotified) continue;

      const message = `Mr ${user.first_name} ${user.last_name}, don’t break your reading streak! You haven’t submitted your daily reading report for today or yesterday.`;

      // Save notification (Members only)
      await Notification.create({
        user: user._id,
        title: "Don't break your streak!",
        message,
        type: "warning",
        meta: {
          kind: "missed-daily-report",
          forDate: today,
          member: memberId,
        },
      });

      // Send push notification (Members only)
      try {
        await sendPushToUser(user._id, {
          title: "Don't break your reading streak!",
          body: message,
        });
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }
  }
}

/* 
   SCHEDULER
 */

export function startDailyReportMissingScheduler(
  intervalMs = 60 * 60 * 1000 // every 1 hour
) {
  // Run immediately
  notifyUsersMissingDailyReport().catch((err) =>
    console.error("Initial scheduler error:", err)
  );

  // Run repeatedly
  return setInterval(() => {
    notifyUsersMissingDailyReport().catch((err) =>
      console.error("Scheduler error:", err)
    );
  }, intervalMs);
}
