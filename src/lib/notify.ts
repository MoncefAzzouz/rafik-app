import prisma from './prisma';
import { sendMail, emailShell, isMailEnabled } from './mailer';

// ── Event email notifications ──
// Fire-and-forget helpers used across the verticals: when an order arrives, when a
// client approves, when a status changes, etc. All are SAFE — they never throw and
// never block the HTTP response (call them with `void notifyX(...)`). If SMTP isn't
// configured they quietly no-op.

async function deliver(to: string, subject: string, bodyHtml: string) {
  try { await sendMail({ to, subject, html: emailShell(subject, bodyHtml) }); }
  catch (e) { console.error('[notify] send failed to', to, e); }
}

// Email every ADMIN user.
export async function notifyAdmins(subject: string, bodyHtml: string): Promise<void> {
  if (!isMailEnabled()) return;
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
    for (const a of admins) if (a.email) await deliver(a.email, subject, bodyHtml);
  } catch (e) { console.error('[notify] admins lookup failed', e); }
}

// Email a specific user by id (skips silently if none/no email).
export async function emailUser(userId: string | null | undefined, subject: string, bodyHtml: string): Promise<void> {
  if (!userId || !isMailEnabled()) return;
  try {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (u?.email) await deliver(u.email, subject, bodyHtml);
  } catch (e) { console.error('[notify] user lookup failed', e); }
}

// Email a raw address (e.g. a phone-only client who left an email on the order).
export async function emailAddress(to: string | null | undefined, subject: string, bodyHtml: string): Promise<void> {
  if (!to || !isMailEnabled()) return;
  await deliver(to, subject, bodyHtml);
}

// ── Small HTML building blocks so every email looks consistent ──
export function pRow(label: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  return `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;font-size:13px">${label}</td><td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600">${value}</td></tr>`;
}
export function infoTable(rows: string[]): string {
  return `<table style="border-collapse:collapse;margin:8px 0">${rows.join('')}</table>`;
}
export function lead(text: string): string {
  return `<p style="color:#334155;line-height:1.6;margin:0 0 12px">${text}</p>`;
}
export function button(label: string, url: string): string {
  return `<p style="margin:20px 0"><a href="${url}" style="background:#0F766E;color:#fff;text-decoration:none;padding:11px 22px;border-radius:12px;font-weight:700;display:inline-block">${label}</a></p>`;
}
