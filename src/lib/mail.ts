/**
 * Outbound mail for HaDay. Never writes .env files — Azure injects keys.
 *
 * Supported (first match wins):
 *   RESEND_API_KEY + optional MAIL_FROM / RESEND_FROM
 *   SENDGRID_API_KEY + optional MAIL_FROM
 *
 * If nothing is configured, password-reset still stores a token and the course
 * owner can copy the link from /admin. Never log or return the token to the
 * requester.
 */

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

export function mailerConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") || env("SENDGRID_API_KEY"));
}

export function passwordResetPageUrl(token: string, fallbackUrl?: string): string {
  const fromEnv = env("BETTER_AUTH_URL")?.replace(/\/+$/, "");
  if (fromEnv) return `${fromEnv}/reset-password?token=${encodeURIComponent(token)}`;
  if (fallbackUrl) {
    try {
      return `${new URL(fallbackUrl).origin}/reset-password?token=${encodeURIComponent(token)}`;
    } catch {
      /* ignore malformed Better Auth url */
    }
  }
  return `/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&" + "amp;";
    if (ch === "<") return "&" + "lt;";
    if (ch === ">") return "&" + "gt;";
    if (ch === '"') return "&" + "quot;";
    return "&" + "#39;";
  });
}

function fromAddress(): string {
  return env("MAIL_FROM") || env("RESEND_FROM") || "HaDay <onboarding@resend.dev>";
}

export async function sendPasswordResetMail(opts: {
  email: string;
  name: string;
  url: string;
  token: string;
}): Promise<{ sent: boolean; via: "resend" | "sendgrid" | "none" }> {
  const pageUrl = passwordResetPageUrl(opts.token, opts.url);
  const greeting = opts.name.trim() ? opts.name.trim() : "there";
  const subject = "Reset your HaDay password";
  const text = [
    `Hi ${greeting},`,
    "",
    "Someone asked to reset the password on this HaDay account.",
    "Open this link in the next hour to choose a new password:",
    pageUrl,
    "",
    "If you did not ask for this, you can ignore the message. Your password stays the same.",
    "",
    "— HaDay · BIBL 630",
  ].join("\n");
  const html = `<p>Hi ${escapeHtml(greeting)},</p>
<p>Someone asked to reset the password on this HaDay account. This link expires in one hour:</p>
<p><a href="${escapeHtml(pageUrl)}">Choose a new password</a></p>
<p>If you did not ask for this, ignore the message. Your password stays the same.</p>
<p>— HaDay · BIBL 630</p>`;

  try {
    const resendKey = env("RESEND_API_KEY");
    if (resendKey) {
      await sendResend({
        apiKey: resendKey,
        from: fromAddress(),
        to: opts.email,
        subject,
        text,
        html,
      });
      return { sent: true, via: "resend" };
    }
    const sendgridKey = env("SENDGRID_API_KEY");
    if (sendgridKey) {
      await sendSendgrid({
        apiKey: sendgridKey,
        from: fromAddress(),
        to: opts.email,
        subject,
        text,
        html,
      });
      return { sent: true, via: "sendgrid" };
    }
  } catch (err) {
    console.error("[mail] password reset send failed", err);
  }

  console.info(
    `[mail] password reset for ${opts.email} stored. No mailer (or send failed); course owner can copy the link from /admin.`,
  );
  return { sent: false, via: "none" };
}

async function sendResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function sendSendgrid(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const fromMatch = opts.from.match(/^(.*)<([^>]+)>$/);
  const from = fromMatch
    ? { name: fromMatch[1].trim().replace(/^"|"$/g, ""), email: fromMatch[2].trim() }
    : { email: opts.from };
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from,
      subject: opts.subject,
      content: [
        { type: "text/plain", value: opts.text },
        { type: "text/html", value: opts.html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SendGrid ${res.status}: ${body.slice(0, 300)}`);
  }
}
