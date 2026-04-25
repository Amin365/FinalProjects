import Issue from "../models/Issue.js";
import User from "../models/user.js";
import Notification from "../models/Notification.js";
import { sendPushToUser } from "../utility/push.js";
import { sendMail } from "../controller/EmailController.js";

/**
 * Calculate number of days between two dates (ignoring hours)
 */
function daysBetweenDates(a, b) {
  const da = new Date(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const db = new Date(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  const diffMs = da - db;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Build email content based on kind
 */
function buildEmail(kind, memberName, bookTitle) {
  if (kind === "overdue") {
    return {
      subject: "📕 Book Overdue",
      text: `Dear ${memberName}, your borrowed book "${bookTitle}" is overdue. Please return it immediately.`,
      html: `
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>We hope this message finds you well.</p>
        <p>This is a gentle reminder that the book <strong>"${bookTitle}"</strong> you borrowed is overdue.</p>
        <p>Please return it at your earliest convenience to avoid any inconvenience.</p>
        <br/>
        <p>Best regards,<br/><strong>${process.env.APP_NAME || "Reading Club"}</strong></p>
      `,
    };
  }

  if (kind === "due-soon") {
    return {
      subject: "📘 Book Due Tomorrow",
      text: `Dear ${memberName}, your borrowed book "${bookTitle}" is due tomorrow.`,
      html: `
        <p>Dear <strong>${memberName}</strong>,</p>
        <p>We hope this message finds you well.</p>
        <p>This is a friendly reminder that the book <strong>"${bookTitle}"</strong> you borrowed is due tomorrow.</p>
        <p>Please make sure to return it on time.</p>
        <br/>
        <p>Best regards,<br/><strong>${process.env.APP_NAME || "Reading Club"}</strong></p>
      `,
    };
  }

  throw new Error("Invalid email kind: " + kind);
}

/**
 * Start the scheduler for due/overdue issues
 */
export function startIssueDueScheduler(intervalMs = 60 * 60 * 1000) {
  const run = async () => {
    try {
      const now = new Date();

      // Get all active issued books
      const activeIssues = await Issue.find({ status: "Issued" })
        .select("_id member returnDate book")
        .populate("book", "title")
        .lean()
        .exec();

      // Send notifications/emails in parallel
      await Promise.allSettled(
        activeIssues.map(async (iss) => {
          try {
            const due = new Date(iss.returnDate);
            const diff = daysBetweenDates(due, now);

            let kind = null;
            if (diff === 1) kind = "due-soon";
            if (diff <= 0) kind = "overdue";
            if (!kind) return;

            // Get member user info
            const memberUser = await User.findOne({ member: iss.member })
              .select("_id email first_name last_name")
              .lean();

            if (!memberUser?._id) return;

            const memberName = `${memberUser.first_name || "Member"} ${memberUser.last_name || ""}`.trim();
            const bookTitle = iss.book?.title || "the book";

            // Prevent duplicate notifications/email
            const exists = await Notification.exists({
              user: memberUser._id,
              "meta.issue": iss._id,
              "meta.kind": kind,
            });
            if (exists) return;

            // Create notification
            await Notification.create({
              user: memberUser._id,
              title: kind === "overdue" ? "Book overdue" : "Book due soon",
              message:
                kind === "overdue"
                  ? `Your borrowed book "${bookTitle}" is overdue.`
                  : `Your borrowed book "${bookTitle}" is due tomorrow.`,
              type: kind === "overdue" ? "error" : "warning",
              meta: { issue: iss._id, kind, sentAt: now },
            });

            // Send push notification
            try {
              await sendPushToUser(memberUser._id, {
                title: kind === "overdue" ? "Book overdue" : "Book due soon",
                body:
                  kind === "overdue"
                    ? `Your borrowed book "${bookTitle}" is overdue.`
                    : `Your borrowed book "${bookTitle}" is due tomorrow.`,
              });
            } catch (pushErr) {
              console.error(`Push send failed for ${memberName}:`, pushErr.message);
            }

            // Send email via Resend
            if (memberUser.email) {
              try {
                const emailContent = buildEmail(kind, memberName, bookTitle);
                await sendMail({
                  to: memberUser.email,
                  subject: emailContent.subject,
                  text: emailContent.text,
                  html: emailContent.html,
                });
                console.log(`✅ Email sent to ${memberUser.email} for "${bookTitle}" (${kind})`);
              } catch (mailErr) {
                console.error(`Email send failed for ${memberName}:`, mailErr.message);
              }
            }
          } catch (issueErr) {
            console.error("Issue processing error:", issueErr.message);
          }
        })
      );
    } catch (e) {
      console.error("Scheduler error:", e);
    }
  };

  // Run immediately and then repeat every intervalMs
  run();
  return setInterval(run, intervalMs);
}
