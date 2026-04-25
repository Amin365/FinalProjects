import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.BREVO_SMTP_KEY,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((err, success) => {
  if (err) console.log("❌ SMTP verify failed:", err.message);
  else console.log("✅ SMTP verified!", success);
});
