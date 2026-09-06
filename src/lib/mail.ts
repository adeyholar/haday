/**
 * Outbound mail for HaDay. Never writes .env files — Azure injects keys.
 *
 * Supported (first match wins):
 *   RESEND_API_KEY + optional MAIL_FROM / RESEND_FROM
 *   SENDGRID_API_KEY + optional MAIL_FROM
 *   SMTP_USER + SMTP_PASS (+ optional SMTP_HOST / SMTP_PORT / MAIL_FROM)
 *
 * If nothing is configured, password-reset still stores a token and the course
 * owner can copy the link from /admin. Never log or return the token to the
 * requester.
 */

export type MailerVia = "resend" | "sendgrid" | "smtp" | "none";

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const AZURE_SHORT = "https://haday.azurewebsites.net";
const AZURE_LONG = "https://haday-bud9cwczfeakh8ce.westus3-01.azurewebsites.net";

function smtpUser(): string | undefined {
  return env("SMTP_USER") || env("SMTP_USERNAME");
}

function smtpPass(): string | undefined {
  return env("SMTP_PASS") || env("SMTP_PASSWORD") || env("SMTP_APP_PASSWORD");
}

function smtpHostFor(user: string | undefined): string | undefined {
  const explicit = env("SMTP_HOST");
  if (explicit) return explicit;
  const domain = (user ?? "").split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") return "smtp.gmail.com";
  if (domain === "yahoo.com" || domain === "ymail.com") return "smtp.mail.yahoo.com";
  if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com") {
    return "smtp.office365.com";
  }
  return undefined;
}

export function mailerVia(): MailerVia {
  if (env("RESEND_API_KEY")) return "resend";
  if (env("SENDGRID_API_KEY")) return "sendgrid";
  if (smtpUser() && smtpPass() && smtpHostFor(smtpUser())) return "smtp";
  return "none";
}

export function mailerConfigured(): boolean {
  return mailerVia() !== "none";
}

function canonicalizeOrigin(raw: string): string {
  let value = raw.trim().replace(/\/+$/, "");
  try {
    value = new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return value;
  }
  if (value === AZURE_SHORT) return AZURE_LONG;
  return value;
}

function isUsablePublicOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return false;
    if (host.endsWith(".grok-sandbox.com") || host.endsWith(".grok.com")) return false;
    if (host === "haday.vercel.app" || host.endsWith(".vercel.app")) return false;
    return true;
  } catch {
    return false;
  }
}

/** Prefer the host the classmate will actually open (this Azure deploy). */
export function passwordResetPageUrl(token: string, fallbackUrl?: string): string {
  const origins: string[] = [];
  const push = (raw?: string) => {
    if (!raw) return;
    const origin = canonicalizeOrigin(raw);
    if (isUsablePublicOrigin(origin) && !origins.includes(origin)) origins.push(origin);
  };
  push(fallbackUrl);
  push(env("PUBLIC_APP_URL"));
  push(env("BETTER_AUTH_URL"));
  const origin = origins[0] ?? AZURE_LONG;
  return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function originFromIncomingRequest(): Promise<string | undefined> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    if (!request) return undefined;
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host")?.split(",")[0]?.trim();
    if (!host) return undefined;
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return canonicalizeOrigin(`${proto}://${host}`);
  } catch {
    return undefined;
  }
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
  const smtp = smtpUser();
  return env("MAIL_FROM") || env("RESEND_FROM") || (smtp ? `HaDay <${smtp}>` : "HaDay <onboarding@resend.dev>");
}

export async function sendPasswordResetMail(opts: {
  email: string;
  name: string;
  url: string;
  token: string;
}): Promise<{ sent: boolean; via: MailerVia }> {
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
    const user = smtpUser();
    const pass = smtpPass();
    const host = smtpHostFor(user);
    if (user && pass && host) {
      await sendSmtp({
        host,
        port: Number(env("SMTP_PORT") || (host === "smtp.gmail.com" ? "465" : "587")),
        user,
        pass,
        from: fromAddress(),
        to: opts.email,
        subject,
        text,
        html,
      });
      return { sent: true, via: "smtp" };
    }
  } catch (err) {
    console.error("[mail] password reset send failed", err);
  }

  console.info(
    `[mail] password reset for ${opts.email} stored. No mailer (or send failed); course owner can copy the link from /admin.`,
  );
  return { sent: false, via: "none" };
}

export async function sendVerificationMail(opts: {
  email: string;
  name: string;
  url: string;
}): Promise<{ sent: boolean; via: MailerVia }> {
  const pageUrl = toPublicAppUrl(opts.url);
  const greeting = opts.name.trim() ? opts.name.trim() : "there";
  const subject = "Confirm your HaDay email";
  const text = [
    `Hi ${greeting},`,
    "",
    "Confirm this email to finish your HaDay account.",
    "Open this link in the next 24 hours:",
    pageUrl,
    "",
    "If you did not create a HaDay account, ignore this message.",
    "",
    "— HaDay · BIBL 630",
  ].join("\n");
  const html = `<p>Hi ${escapeHtml(greeting)},</p>
<p>Confirm this email to finish your HaDay account. This link expires in 24 hours:</p>
<p><a href="${escapeHtml(pageUrl)}">Confirm my email</a></p>
<p>If you did not create a HaDay account, ignore this message.</p>
<p>— HaDay · BIBL 630</p>`;
  const result = await sendAnyMail({ to: opts.email, subject, text, html });
  if (!result.sent) {
    console.info(
      `[mail] verification for ${opts.email} not sent (no mailer or send failed).`,
    );
  }
  return result;
}

/** Rewrite sandbox/localhost verification links onto the public class host. */
export function toPublicAppUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (isUsablePublicOrigin(parsed.origin)) return url;
    const origins: string[] = [];
    const push = (raw?: string) => {
      if (!raw) return;
      const origin = canonicalizeOrigin(raw);
      if (isUsablePublicOrigin(origin) && !origins.includes(origin)) origins.push(origin);
    };
    push(env("PUBLIC_APP_URL"));
    push(env("BETTER_AUTH_URL"));
    const origin = origins[0] ?? AZURE_LONG;
    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

async function sendAnyMail(opts: { to: string; subject: string; text: string; html: string }): Promise<{ sent: boolean; via: MailerVia }> {
  try {
    const resendKey = env("RESEND_API_KEY");
    if (resendKey) {
      await sendResend({ apiKey: resendKey, from: fromAddress(), to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
      return { sent: true, via: "resend" };
    }
    const sendgridKey = env("SENDGRID_API_KEY");
    if (sendgridKey) {
      await sendSendgrid({ apiKey: sendgridKey, from: fromAddress(), to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
      return { sent: true, via: "sendgrid" };
    }
    const user = smtpUser();
    const pass = smtpPass();
    const host = smtpHostFor(user);
    if (user && pass && host) {
      await sendSmtp({
        host,
        port: Number(env("SMTP_PORT") || (host === "smtp.gmail.com" ? "465" : "587")),
        user,
        pass,
        from: fromAddress(),
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      return { sent: true, via: "smtp" };
    }
  } catch (err) {
    console.error("[mail] send failed", err);
  }
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

async function sendSmtp(opts: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const mod = (await import("nodemailer")) as unknown as {
    createTransport?: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<unknown> };
    default?: {
      createTransport: (opts: Record<string, unknown>) => { sendMail: (opts: Record<string, unknown>) => Promise<unknown> };
    };
  };
  const createTransport = mod.createTransport ?? mod.default?.createTransport;
  if (!createTransport) throw new Error("nodemailer createTransport missing");
  const transporter = createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.port === 465,
    auth: { user: opts.user, pass: opts.pass },
  });
  await transporter.sendMail({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
