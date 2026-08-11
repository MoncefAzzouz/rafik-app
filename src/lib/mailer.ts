import nodemailer, { Transporter } from 'nodemailer';

// ── Email via SMTP ──
// Configure with env vars (works with Gmail, OVH, SendGrid SMTP, Mailgun SMTP…):
//   MAIL_HOST=smtp.gmail.com
//   MAIL_PORT=587
//   MAIL_SECURE=false            # true for port 465
//   MAIL_USER=you@example.com
//   MAIL_PASS=app-password
//   MAIL_FROM="Rafik <no-reply@rafik.app>"
// If MAIL_HOST is not set, emails are logged to the console instead of sent, so
// development and the Play-Store review flow never crash for a missing provider.
//
// Read lazily: dotenv.config() runs after module import, so we must not cache at load time.
function cfg() {
  return {
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: (process.env.MAIL_SECURE || 'false') === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'Rafik <no-reply@rafik.app>',
  };
}

export function isMailEnabled(): boolean {
  return !!cfg().host;
}

let cached: Transporter | null = null;
function transporter(): Transporter | null {
  const c = cfg();
  if (!c.host) return null;
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: c.user ? { user: c.user, pass: c.pass } : undefined,
  });
  return cached;
}

export interface MailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Returns true if actually dispatched to an SMTP server, false if it was only
// logged (no provider configured). Never throws for a missing provider.
export async function sendMail(input: MailInput): Promise<boolean> {
  const t = transporter();
  const to = Array.isArray(input.to) ? input.to.join(', ') : input.to;
  if (!t) {
    console.log(`[mailer] (not sent — MAIL_HOST unset) To: ${to} | Subject: ${input.subject}`);
    return false;
  }
  await t.sendMail({
    from: cfg().from,
    to,
    subject: input.subject,
    html: input.html,
    text: input.text || input.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  });
  return true;
}

// Minimal branded wrapper so every email looks consistent.
export function emailShell(title: string, bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#0F766E;padding:24px 32px"><span style="color:#fff;font-weight:800;font-size:22px;letter-spacing:-0.5px">RAFIK</span></div>
    <div style="padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${title}</h1>
      ${bodyHtml}
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">Rafik · Sétif, Algérie</div>
  </div>
</div>`;
}
