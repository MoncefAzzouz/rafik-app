import { initializeApp, cert, getApps, getApp, App, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

// ── Firebase Cloud Messaging (push notifications) ──
// Configure the backend with ONE of these env vars (read lazily):
//   FIREBASE_SERVICE_ACCOUNT       = the whole service-account JSON on one line
//   FIREBASE_SERVICE_ACCOUNT_PATH  = absolute path to the service-account .json file
// If neither is set, push is a no-op (nothing crashes) — same pattern as the mailer.
function credentialInput(): string | ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (raw && raw.trim().startsWith('{')) {
    try { return JSON.parse(raw) as ServiceAccount; }
    catch (e) { console.error('[push] FIREBASE_SERVICE_ACCOUNT is not valid JSON:', e); return null; }
  }
  if (file) { const p = path.resolve(file); return fs.existsSync(p) ? p : null; }
  return null;
}

export function isPushEnabled(): boolean {
  return !!credentialInput();
}

let cachedApp: App | null = null;
function fbApp(): App | null {
  if (cachedApp) return cachedApp;
  const input = credentialInput();
  if (!input) return null;
  try {
    cachedApp = getApps().length ? getApp() : initializeApp({ credential: cert(input) });
    return cachedApp;
  } catch (e) {
    console.error('[push] Firebase init failed:', e);
    return null;
  }
}

export interface PushResult { sent: number; failed: number; invalidTokens: string[]; }

// Send a notification to many device tokens. Returns counts + tokens FCM says are
// dead (so the caller can prune them). Never throws for a missing/invalid config.
export async function sendPush(
  tokens: string[],
  msg: { title: string; body: string; data?: Record<string, string> },
): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, invalidTokens: [] };
  const app = fbApp();
  if (!app || tokens.length === 0) return result;
  const messaging = getMessaging(app);
  // FCM multicast is capped at 500 tokens per call.
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    try {
      const resp = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title: msg.title, body: msg.body },
        data: msg.data || {},
      });
      resp.responses.forEach((r, idx) => {
        if (r.success) { result.sent++; return; }
        result.failed++;
        const code = r.error?.code || '';
        if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument')) {
          result.invalidTokens.push(batch[idx]);
        }
      });
    } catch (e) {
      console.error('[push] batch send failed:', e);
      result.failed += batch.length;
    }
  }
  return result;
}
