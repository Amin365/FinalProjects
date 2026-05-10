import { Resend } from "resend";
import dotenv from "dotenv";
import Member from "../models/Members.js";

dotenv.config();

// Destructure environment variables
const { RESEND_API_KEY, EMAIL_FROM_NAME, EMAIL_FROM, APP_NAME } = process.env;

if (!RESEND_API_KEY) {
  console.warn("⚠️ Missing RESEND_API_KEY in environment");
}

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

export const buildEmailHtml = ({
  title,
  preheader,
  greeting,
  bodyLines = [],
  ctaLabel,
  ctaUrl,
  footerNote,
}) => {
  const appName = APP_NAME || "Reading Club";
  const safeTitle = title || `Message from ${appName}`;
  const safeGreeting = greeting || "Hello";
  const safeFooter = footerNote || `You’re receiving this message from ${appName}.`;

  const lines = bodyLines
    .map((line) => `<p style="margin:0 0 12px;">${line}</p>`)
    .join("");

  const cta = ctaLabel && ctaUrl
    ? `
      <div style="margin:20px 0 8px;">
        <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#f97316;color:#fff;text-decoration:none;font-weight:600;">
          ${ctaLabel}
        </a>
      </div>
    `
    : "";

  return `
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader || safeTitle}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#0f172a;color:#ffffff;padding:20px 24px;">
              <h1 style="margin:0;font-size:20px;">${safeTitle}</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#cbd5f5;">${appName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6;">
              <p style="margin:0 0 12px;font-weight:600;">${safeGreeting}</p>
              ${lines}
              ${cta}
              <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">
                ${safeFooter}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
};

const getConfiguredSender = () => {
  const fromName = EMAIL_FROM_NAME || APP_NAME || "No Reply";
  const fromAddress = String(
    EMAIL_FROM || (process.env.NODE_ENV === "production" ? "" : "onboarding@resend.dev")
  ).trim();

  if (!fromAddress) {
    throw new Error("EMAIL_FROM is required and must be a verified Resend sender address");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    throw new Error(`EMAIL_FROM must be an email address, received "${fromAddress}"`);
  }

  return {
    from: `"${fromName}" <${fromAddress}>`,
    fromAddress,
    fromDomain: fromAddress.split("@")[1]?.toLowerCase(),
  };
};

const explainResendError = (errorMessage, fromDomain) => {
  const message = errorMessage || "Resend failed to send email";
  if (/not authorized to send emails from/i.test(message)) {
    return `${message}. Check that EMAIL_FROM uses a sender/domain verified in the same Resend account as RESEND_API_KEY${fromDomain ? ` (${fromDomain})` : ""}.`;
  }
  return message;
};

/**
 * sendMail utility using Resend
 * Supports both HTML and plain text
 */
export async function sendMail({ to, subject, text, html }) {
  if (!to) throw new Error("Missing 'to' address");
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const { from, fromAddress, fromDomain } = getConfiguredSender();

  // Resend requires HTML; fallback to plain text wrapped in <pre>
  const finalHtml = html || `<pre>${text || ""}</pre>`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html: finalHtml,
    text: text || undefined,
  });

  if (error) {
    console.error("Resend send failed", {
      to,
      subject,
      fromAddress,
      fromDomain,
      message: error.message,
    });
    throw new Error(explainResendError(error.message, fromDomain));
  }

  console.info("✅ Resend accepted email", {
    to,
    subject,
    messageId: data?.id || data?.messageId,
  });

  return data;
}

/**
 * Express controller to send email to a member
 * POST /members/:id/send-email
 */
export const sendMemberEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, text, html, to: overrideTo } = req.body ?? {};

    if (!id) {
      return res.status(400).json({ message: "Missing member id" });
    }

    // Load member
    const member = await Member.findById(id).lean().exec();
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const recipient = overrideTo || member.email;
    if (!recipient) {
      return res.status(400).json({ message: "Member has no email" });
    }

    // Default subject
    const finalSubject = subject || `Message from ${APP_NAME || "the team"}`;

    // Default plain text
    const finalText =
      text ||
      `Hello ${member.first_name ?? ""} ${member.last_name ?? ""},

We hope you are doing well. This message was sent by ${APP_NAME || "the team"}.
If you have any questions, feel free to reply to this email and we will assist you.

Regards,
${EMAIL_FROM_NAME || APP_NAME || "Team"}`;

    // Default HTML version
    const finalHtml =
      html ||
      buildEmailHtml({
        title: finalSubject,
        preheader: "A quick update from the club",
        greeting: `Hello ${member.first_name ?? ""} ${member.last_name ?? ""}`.trim(),
        bodyLines: [
          `We hope you're doing well. This message was sent by <strong>${APP_NAME || "the team"}</strong>.`,
          "If you have any questions or need support, simply reply to this email and we'll be happy to help.",
          "Thank you for being part of the community.",
        ],
        footerNote: `Regards, ${EMAIL_FROM_NAME || APP_NAME || "Team"}`,
      });

    // Send email
    const info = await sendMail({
      to: recipient,
      subject: finalSubject,
      text: finalText,
      html: finalHtml,
    });

    return res.status(200).json({
      message: "Email sent successfully",
      messageId: info?.id || info?.messageId,
    });
  } catch (err) {
    console.error("❌ sendMemberEmail error:", err);
    return res.status(500).json({
      message: err.message || "Failed to send email",
    });
  }
};

export default { sendMemberEmail, sendMail };
