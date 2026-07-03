import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendVerificationEmail = async (email: string, code?: string) => {
  const {
    SMTP_HOST,
    EMAIL_USER,
    PASSWORD_SECRET,
    SMTP_PORT,
  } = process.env;

  if (!SMTP_HOST || !EMAIL_USER || !PASSWORD_SECRET) {
    throw new Error("Missing SMTP env vars: SMTP_HOST, EMAIL_USER, PASSWORD_SECRET");
  }

  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
    auth: {
      user: EMAIL_USER,
      pass: PASSWORD_SECRET,
    },
  });

  await transporter.sendMail({
    from: `"Chat App" <${EMAIL_USER}>`, // أو استخدم SMTP_FROM لو Brevo يفضله
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${code}</h1>
    `,
  });
};