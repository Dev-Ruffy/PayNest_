import { env } from "../config/env";
import { logger } from "../config/logger";

// Sent over Brevo's HTTPS transactional email API rather than SMTP.
// Outbound SMTP (ports 25/465/587) is permanently blocked on Render's free
// tier — and several other free hosting tiers — as an anti-spam measure, but
// a plain HTTPS POST like this one isn't affected by that at all.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendMail(to: string, subject: string, html: string) {
  if (!env.BREVO_API_KEY) {
    // No API key configured — logged instead of sent. This is expected for
    // local development; see sendVerificationCode for the code-specific
    // fallback that developers actually need to see during testing.
    logger.info(`[No BREVO_API_KEY configured] Would send "${subject}" to ${to}`);
    return;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: env.MAIL_FROM_NAME, email: env.MAIL_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(`Failed to send email to ${to}: Brevo responded ${res.status} — ${body}`);
    }
  } catch (err) {
    // Email delivery failures should never crash a request — they are
    // logged so the developer can investigate.
    logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
  }
}

const wrapper = (title: string, bodyHtml: string) => `
  <div style="font-family: -apple-system, Inter, Arial, sans-serif; background:#F6F1E4; padding:32px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ECE4D0;">
      <div style="background:#12172A;padding:24px 32px;">
        <span style="color:#C89B3C;font-size:20px;font-weight:700;letter-spacing:0.5px;">PayNest</span>
      </div>
      <div style="padding:32px;color:#1E2436;">
        <h2 style="margin-top:0;color:#12172A;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 32px;background:#F6F1E4;color:#8A8370;font-size:12px;">
        This is an automated message from PayNest — the school wallet & tuck-shop settlement platform.
      </div>
    </div>
  </div>
`;

export const emailService = {
  async notifyDeveloperOfNewSchool(params: { registrantName: string; schoolName: string; schoolEmail: string }) {
    await sendMail(
      env.DEVELOPER_NOTIFY_EMAIL,
      `New school registration: ${params.schoolName}`,
      wrapper(
        "New school registration request",
        `<p><strong>Registrant:</strong> ${params.registrantName}</p>
         <p><strong>School name:</strong> ${params.schoolName}</p>
         <p><strong>School email:</strong> ${params.schoolEmail}</p>
         <p>Review and approve this request from the Developer Dashboard.</p>`
      )
    );
  },

  async sendVerificationCode(schoolEmail: string, code: string, housemasterPassword: string) {
    if (!env.BREVO_API_KEY) {
      // No API key configured — the email below will silently do nothing, so
      // this is the only way to actually get the code. Printed regardless of
      // NODE_ENV: if Brevo isn't set up, there's no other path to the code.
      logger.info(`[No BREVO_API_KEY configured] Verification code for ${schoolEmail}: ${code}`);
      logger.info(`[No BREVO_API_KEY configured] Housemaster shared password: ${housemasterPassword}`);
    }
    await sendMail(
      schoolEmail,
      "Your PayNest verification code",
      wrapper(
        "Verify your school",
        `<p>Your school registration has been approved. Enter this code to activate your account:</p>
         <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#C89B3C;">${code}</p>
         <p>This code expires in 30 minutes.</p>
         <p style="margin-top:24px;"><strong>Shared Housemaster password:</strong> ${housemasterPassword}</p>
         <p>Share this password with Housemasters/Housemistresses so they can log in. The Principal can change it any time from Settings.</p>`
      )
    );
  },

  async sendPasswordResetCode(email: string, name: string, code: string) {
    if (!env.BREVO_API_KEY) {
      logger.info(`[No BREVO_API_KEY configured] Password reset code for ${email}: ${code}`);
    }
    await sendMail(
      email,
      "Your PayNest password reset code",
      wrapper(
        "Reset your password",
        `<p>Hi ${name}, enter this code to reset your PayNest password:</p>
         <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#C89B3C;">${code}</p>
         <p>This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>`
      )
    );
  },

  async notifySchoolApproved(schoolEmail: string, schoolName: string) {
    await sendMail(
      schoolEmail,
      "PayNest — School approved",
      wrapper("You're approved!", `<p>${schoolName} has been approved by the PayNest developer. Check your inbox for a verification code.</p>`)
    );
  },

  async notifySchoolRejected(schoolEmail: string, schoolName: string, reason?: string) {
    await sendMail(
      schoolEmail,
      "PayNest — School registration update",
      wrapper(
        "Registration not approved",
        `<p>Unfortunately, the registration for ${schoolName} was not approved.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}`
      )
    );
  },

  async notifyStaffApproval(email: string, name: string, role: string, approved: boolean) {
    await sendMail(
      email,
      `PayNest — ${approved ? "Registration approved" : "Registration declined"}`,
      wrapper(
        approved ? "You're approved!" : "Registration declined",
        `<p>Hi ${name}, your ${role} registration has been ${approved ? "approved. You can now log in." : "declined by your School Admin."}</p>`
      )
    );
  },
};
