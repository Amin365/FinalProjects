/**
 * Email Templates for Phase 6 Communication System
 * 
 * These templates are used for various notification emails throughout the app.
 */

import { buildEmailHtml } from "../controller/EmailController.js";

const APP_NAME = process.env.APP_NAME || "JJU Reading Club";
const APP_URL = process.env.APP_URL || "https://jjureadingclub.com";

/**
 * Welcome email for new members
 */
export function welcomeEmailTemplate({ firstName, lastName, memberCode, username, setupUrl, expiresIn = "72 hours" }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";
  const bodyLines = [
    `Welcome to <strong>${APP_NAME}</strong>! We're thrilled to have you as a member of our reading community.`,
    `<strong>Your Member Code:</strong> ${memberCode || "N/A"}`,
    username ? `<strong>Username:</strong> ${username}` : "",
    "Here's what you can do now:",
    "• Browse our collection of books",
    "• Submit daily reading reports",
    "• Join reading challenges",
    "• Track your progress on the leaderboard",
    setupUrl ? `Use the button below to set your password and activate your account. This link expires in ${expiresIn}.` : "",
    "Happy reading!",
  ].filter(Boolean);
  
  return {
    subject: `Welcome to ${APP_NAME}! 🎉`,
    text: `Dear ${fullName},

Welcome to ${APP_NAME}! We're thrilled to have you as a member of our reading community.

Your Member Code: ${memberCode || "N/A"}
${username ? `
Username: ${username}` : ""}

Here's what you can do now:
- Browse our collection of books
- Submit daily reading reports
- Join reading challenges
- Track your progress on the leaderboard

${setupUrl ? `Set your password here: ${setupUrl}
This link expires in ${expiresIn}.
` : ""}

Happy reading!

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: `Welcome to ${APP_NAME}! 🎉`,
      preheader: "Your reading journey starts now",
      greeting: `Dear ${fullName}`,
      bodyLines,
      ctaLabel: setupUrl ? "Set Up Password" : "Get Started",
      ctaUrl: setupUrl || `${APP_URL}/dashboard`,
      footerNote: `You're receiving this because you joined ${APP_NAME}.`,
    }),
  };
}

/**
 * Book due tomorrow reminder
 */
export function issueDueTomorrowTemplate({ firstName, lastName, bookTitle, dueDate }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";
  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    subject: `📚 Reminder: "${bookTitle}" is due tomorrow`,
    text: `Dear ${fullName},

This is a friendly reminder that the book "${bookTitle}" is due tomorrow (${formattedDate}).

Please return it on time to avoid any overdue fees and to allow other members to enjoy the book.

If you need more time, please contact us to request an extension.

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Book Due Tomorrow",
      preheader: `"${bookTitle}" is due tomorrow`,
      greeting: `Dear ${fullName}`,
      bodyLines: [
        `This is a friendly reminder that the book <strong>"${bookTitle}"</strong> is due tomorrow (<strong>${formattedDate}</strong>).`,
        "Please return it on time to avoid any overdue fees and to allow other members to enjoy the book.",
        "If you need more time, please contact us to request an extension.",
      ],
      ctaLabel: "View My Books",
      ctaUrl: `${APP_URL}/dashboard/issues`,
      footerNote: `You're receiving this reminder from ${APP_NAME}.`,
    }),
  };
}

/**
 * Book overdue notification
 */
export function issueOverdueTemplate({ firstName, lastName, bookTitle, dueDate, daysOverdue }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";
  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    subject: `⚠️ Overdue: "${bookTitle}" was due ${daysOverdue} day(s) ago`,
    text: `Dear ${fullName},

The book "${bookTitle}" is now ${daysOverdue} day(s) overdue. It was due on ${formattedDate}.

Please return it as soon as possible to avoid accumulating overdue fees.

If you have already returned the book, please disregard this email. If you need assistance, please contact us.

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Book Overdue Notice",
      preheader: `"${bookTitle}" is ${daysOverdue} day(s) overdue`,
      greeting: `Dear ${fullName}`,
      bodyLines: [
        `The book <strong>"${bookTitle}"</strong> is now <strong>${daysOverdue} day(s) overdue</strong>.`,
        `It was due on <strong>${formattedDate}</strong>.`,
        "Please return it as soon as possible to avoid accumulating overdue fees.",
        "If you have already returned the book, please disregard this email. If you need assistance, please contact us.",
      ],
      ctaLabel: "View My Books",
      ctaUrl: `${APP_URL}/dashboard/issues`,
      footerNote: `This is an automated overdue notice from ${APP_NAME}.`,
    }),
  };
}

/**
 * Join request approved
 */
export function joinApprovalTemplate({ firstName, lastName, memberCode }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";

  return {
    subject: `🎉 Your membership request has been approved!`,
    text: `Dear ${fullName},

Great news! Your request to join ${APP_NAME} has been approved.

Your Member Code: ${memberCode || "N/A"}

You can now log in to your account and start exploring our library, submitting reading reports, and joining challenges.

Welcome to the club!

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Membership Approved! 🎉",
      preheader: "Welcome to the club",
      greeting: `Dear ${fullName}`,
      bodyLines: [
        `Great news! Your request to join <strong>${APP_NAME}</strong> has been approved.`,
        `<strong>Your Member Code:</strong> ${memberCode || "N/A"}`,
        "You can now log in to your account and start exploring our library, submitting reading reports, and joining challenges.",
        "Welcome to the club!",
      ],
      ctaLabel: "Log In Now",
      ctaUrl: `${APP_URL}/login`,
      footerNote: `Welcome to ${APP_NAME}!`,
    }),
  };
}

/**
 * Join request rejected
 */
export function joinRejectionTemplate({ firstName, lastName, reason }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Applicant";

  return {
    subject: `Update on your ${APP_NAME} membership request`,
    text: `Dear ${fullName},

Thank you for your interest in joining ${APP_NAME}.

Unfortunately, we are unable to approve your membership request at this time.${reason ? `\n\nReason: ${reason}` : ""}

If you believe this is a mistake or have questions, please feel free to contact us.

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Membership Request Update",
      preheader: "Update on your application",
      greeting: `Dear ${fullName}`,
      bodyLines: [
        `Thank you for your interest in joining <strong>${APP_NAME}</strong>.`,
        "Unfortunately, we are unable to approve your membership request at this time.",
        reason ? `<strong>Reason:</strong> ${reason}` : "",
        "If you believe this is a mistake or have questions, please feel free to contact us.",
      ].filter(Boolean),
      footerNote: `This email was sent from ${APP_NAME}.`,
    }),
  };
}

/**
 * Daily reading reminder
 */
export function readingReminderTemplate({ firstName, lastName, currentStreak, streakGoal }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";

  return {
    subject: `📖 Don't forget to read today!`,
    text: `Dear ${fullName},

This is your daily reading reminder! Keep your streak alive.

${currentStreak > 0 ? `Current Streak: ${currentStreak} days 🔥` : "Start building your streak today!"}
${streakGoal ? `Goal: ${streakGoal} days` : ""}

Submit your reading report to maintain your streak and stay on top of the leaderboard!

Happy reading!

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Daily Reading Reminder 📖",
      preheader: "Keep your reading streak alive",
      greeting: `Dear ${fullName}`,
      bodyLines: [
        "This is your daily reading reminder! Keep your streak alive.",
        currentStreak > 0 
          ? `<strong>Current Streak:</strong> ${currentStreak} days 🔥` 
          : "Start building your streak today!",
        streakGoal ? `<strong>Goal:</strong> ${streakGoal} days` : "",
        "Submit your reading report to maintain your streak and stay on top of the leaderboard!",
        "Happy reading!",
      ].filter(Boolean),
      ctaLabel: "Submit Report",
      ctaUrl: `${APP_URL}/dashboard/report`,
      footerNote: `You're receiving this reminder from ${APP_NAME}. You can disable these in your notification settings.`,
    }),
  };
}

/**
 * Challenge reminder
 */
export function challengeReminderTemplate({ 
  firstName, 
  lastName, 
  challengeTitle, 
  daysRemaining, 
  currentProgress, 
  targetProgress 
}) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";
  const progressPercent = targetProgress > 0 ? Math.round((currentProgress / targetProgress) * 100) : 0;

  return {
    subject: `🏆 Challenge Update: "${challengeTitle}" - ${daysRemaining} days remaining`,
    text: `Dear ${fullName},

Here's an update on your challenge progress:

Challenge: ${challengeTitle}
Days Remaining: ${daysRemaining}
Progress: ${currentProgress}/${targetProgress} (${progressPercent}%)

Keep going! You've got this!

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Challenge Progress Update 🏆",
      preheader: `${daysRemaining} days remaining in "${challengeTitle}"`,
      greeting: `Dear ${fullName}`,
      bodyLines: [
        "Here's an update on your challenge progress:",
        `<strong>Challenge:</strong> ${challengeTitle}`,
        `<strong>Days Remaining:</strong> ${daysRemaining}`,
        `<strong>Progress:</strong> ${currentProgress}/${targetProgress} (${progressPercent}%)`,
        progressPercent >= 80 
          ? "Almost there! 🎯 Keep up the great work!" 
          : progressPercent >= 50 
            ? "You're making good progress! Keep going!" 
            : "Keep pushing! Every page counts!",
      ],
      ctaLabel: "View Challenge",
      ctaUrl: `${APP_URL}/dashboard/challenges`,
      footerNote: `You're receiving this because you joined a challenge on ${APP_NAME}.`,
    }),
  };
}

/**
 * Achievement unlocked notification
 */
export function achievementUnlockedTemplate({ firstName, lastName, achievementTitle, achievementDescription, achievementIcon }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";

  return {
    subject: `🏅 Achievement Unlocked: "${achievementTitle}"`,
    text: `Dear ${fullName},

Congratulations! You've unlocked a new achievement!

🏅 ${achievementTitle}
${achievementDescription || ""}

Keep reading to unlock more achievements!

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Achievement Unlocked! 🏅",
      preheader: `You earned: ${achievementTitle}`,
      greeting: `Dear ${fullName}`,
      bodyLines: [
        "Congratulations! You've unlocked a new achievement!",
        `<div style="text-align:center;font-size:48px;margin:16px 0;">${achievementIcon || "🏅"}</div>`,
        `<strong style="font-size:18px;">${achievementTitle}</strong>`,
        achievementDescription ? `<em>${achievementDescription}</em>` : "",
        "Keep reading to unlock more achievements!",
      ].filter(Boolean),
      ctaLabel: "View All Achievements",
      ctaUrl: `${APP_URL}/dashboard/achievements`,
      footerNote: `You earned this achievement on ${APP_NAME}.`,
    }),
  };
}

/**
 * System announcement template
 */
export function announcementTemplate({ firstName, lastName, title, message, ctaLabel, ctaUrl }) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";

  return {
    subject: `📢 ${title}`,
    text: `Dear ${fullName},

${message}

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: `📢 ${title}`,
      preheader: message.substring(0, 100),
      greeting: `Dear ${fullName}`,
      bodyLines: [message],
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl || null,
      footerNote: `This announcement was sent from ${APP_NAME}.`,
    }),
  };
}

/**
 * Goal completed notification
 */
export function goalCompletedTemplate({
  firstName,
  lastName,
  goalLabel,
  currentValue,
  targetValue,
}) {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "Reader";

  return {
    subject: `🎯 Goal completed: ${goalLabel}`,
    text: `Dear ${fullName},

Congratulations! You have reached your reading goal.

Goal: ${goalLabel}
Progress: ${currentValue}/${targetValue}

Keep going and set your next reading target!

Best regards,
The ${APP_NAME} Team`,
    html: buildEmailHtml({
      title: "Goal Completed! 🎯",
      preheader: `You reached your ${goalLabel.toLowerCase()} goal`,
      greeting: `Dear ${fullName}`,
      bodyLines: [
        "Congratulations! You have reached your reading goal.",
        `<strong>Goal:</strong> ${goalLabel}`,
        `<strong>Progress:</strong> ${currentValue}/${targetValue}`,
        "Keep going and set your next reading target!",
      ],
      ctaLabel: "View My Goals",
      ctaUrl: `${APP_URL}/dashboard/goals`,
      footerNote: `You are receiving this because you completed a goal on ${APP_NAME}.`,
    }),
  };
}

export default {
  welcomeEmailTemplate,
  issueDueTomorrowTemplate,
  issueOverdueTemplate,
  joinApprovalTemplate,
  joinRejectionTemplate,
  readingReminderTemplate,
  challengeReminderTemplate,
  achievementUnlockedTemplate,
  goalCompletedTemplate,
  announcementTemplate,
};
