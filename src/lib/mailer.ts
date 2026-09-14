import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    // No provider configured yet — log so the flow still works in dev.
    console.warn('RESEND_API_KEY not set; skipping email send. Reset URL:', resetUrl);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'CV Edit Pro <onboarding@resend.dev>',
    to,
    subject: 'Reset your CV Edit Pro password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111827;">Reset your password</h2>
        <p style="color: #374151; font-size: 14px;">
          We received a request to reset your CV Edit Pro password. Click the button below to choose a new one.
          This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; margin: 16px 0; padding: 10px 20px; background: #111827; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 12px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
