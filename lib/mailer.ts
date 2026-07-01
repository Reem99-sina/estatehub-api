import nodemailer from "nodemailer";

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendVerificationEmail = async (email: string, code?: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.PASSWORD_SECRET||'ewrr qaml sknk reeg',
    },
  });

  await transporter.sendMail({
    from: `"Chat App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <p>Your verification code is:</p>
      <h1>${code}</h1>
    `,
  });
};