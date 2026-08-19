import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { sendMail, emailShell, isMailEnabled } from '../lib/mailer';
import { sendPush, isPushEnabled } from '../lib/push';

const router = Router();

// Decode a Bearer token if present, but don't require it (device registration can
// happen before or after login).
function optionalUser(req: Request): { userId: string; role: string } | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET as string) as any; }
  catch { return null; }
}

// Audience → Prisma role filter (shared by email + push fan-out).
function roleWhere(audience: string) {
  if (audience === 'clients') return { role: 'CLIENT' as const };
  if (audience === 'workers') return { role: 'WORKER' as const };
  if (audience === 'drivers') return { role: 'DRIVER' as const };
  return {};
}

// The four open pages the Play Store requires. slug is fixed to this set.
const LEGAL_SLUGS = ['privacy-policy', 'terms', 'delete-account', 'support'];
const LEGAL_TITLES: Record<string, string> = {
  'privacy-policy': 'Privacy Policy',
  terms: 'Terms & Conditions',
  'delete-account': 'Delete Your Account',
  support: 'Support',
};

// ═══════════════════════ PUBLIC (mobile app) ═══════════════════════

// Home grid tiles the app should render, in order.
router.get('/modules', async (_req: Request, res: Response) => {
  try {
    const modules = await prisma.appModule.findMany({
      where: { visible: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(modules);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Slides — ?type=home (default) or ?type=promo
router.get('/slides', async (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'home';
  try {
    const slides = await prisma.appSlide.findMany({
      where: { visible: true, type },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(slides);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Promo codes the admin chose to surface in the app (active + not expired).
router.get('/promos', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const promos = await prisma.promoCode.findMany({
      where: {
        showInApp: true,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, code: true, description: true, scope: true, discountType: true,
        discountValue: true, maxDiscount: true, minOrderAmount: true, expiresAt: true, appBanner: true,
      },
    });
    res.json(promos);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// In-app notification feed (most recent first).
router.get('/notifications', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '30', 10), 100);
  try {
    const items = await prisma.appNotification.findMany({
      where: { channel: { contains: 'app' } }, // channel is a comma list, e.g. "app,push"
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// A legal/support page's content (also rendered by the public web pages).
router.get('/legal/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  if (!LEGAL_SLUGS.includes(slug)) { res.status(404).json({ error: 'Unknown page' }); return; }
  try {
    const page = await prisma.appLegalPage.findUnique({ where: { slug } });
    res.json(page || { slug, title: LEGAL_TITLES[slug], content: '', updatedAt: null });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Register a phone's FCM token (the Flutter app calls this on login/startup).
// Optional auth: if a Bearer token is sent, the device is linked to that user.
router.post('/device-token', async (req: Request, res: Response) => {
  const token = (req.body?.token || '').trim();
  const platform = req.body?.platform || null;
  if (!token) { res.status(400).json({ error: 'token is required' }); return; }
  const user = optionalUser(req);
  try {
    await prisma.deviceToken.upsert({
      where: { token },
      update: { userId: user?.userId ?? null, platform },
      create: { token, userId: user?.userId ?? null, platform },
    });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Unregister a token (app calls this on logout / uninstall cleanup).
router.delete('/device-token', async (req: Request, res: Response) => {
  const token = (req.body?.token || '').trim();
  if (!token) { res.status(400).json({ error: 'token is required' }); return; }
  try {
    await prisma.deviceToken.deleteMany({ where: { token } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ═══════════════════════ ADMIN ═══════════════════════
const admin = [authenticateToken, requireRole('ADMIN')];

// Whether email + push are configured on the server (drives UI hints).
router.get('/admin/status', ...admin, async (_req: Request, res: Response) => {
  const devices = await prisma.deviceToken.count();
  res.json({ mailConfigured: isMailEnabled(), pushConfigured: isPushEnabled(), devices });
});

// Per-vertical count of orders still waiting on someone (drives the sidebar red dot).
router.get('/admin/pending-counts', ...admin, async (_req: Request, res: Response) => {
  try {
    const [truck, food, taxi, services, trucksToVerify] = await Promise.all([
      prisma.truckOrder.count({ where: { status: 'requested' } }),
      prisma.foodOrder.count({ where: { status: 'pending' } }),
      prisma.taxiRide.count({ where: { status: 'requested' } }),
      prisma.booking.count({ where: { status: { in: ['pending_review', 'awaiting_worker'] } } }),
      prisma.truck.count({ where: { isVerified: false, isActive: true } }),
    ]);
    res.json({ truck, food, taxi, services, trucksToVerify });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Admin notification bell (top bar) ──
// List recent admin notifications + unread count.
router.get('/admin/alerts', ...admin, async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '30', 10), 100);
  try {
    const [items, unread] = await Promise.all([
      prisma.adminNotification.findMany({ orderBy: { createdAt: 'desc' }, take: limit }),
      prisma.adminNotification.count({ where: { readAt: null } }),
    ]);
    res.json({ items, unread });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Mark everything read.
router.put('/admin/alerts/read-all', ...admin, async (_req: Request, res: Response) => {
  try {
    await prisma.adminNotification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Mark one read.
router.put('/admin/alerts/:id/read', ...admin, async (req: Request, res: Response) => {
  try {
    await prisma.adminNotification.update({ where: { id: req.params.id as string }, data: { readAt: new Date() } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Clear (delete) all admin notifications.
router.delete('/admin/alerts', ...admin, async (_req: Request, res: Response) => {
  try {
    await prisma.adminNotification.deleteMany({});
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Modules (home grid) ──
router.get('/admin/modules', ...admin, async (_req: Request, res: Response) => {
  const modules = await prisma.appModule.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(modules);
});

router.post('/admin/modules', ...admin, async (req: Request, res: Response) => {
  const d = req.body;
  try {
    const max = await prisma.appModule.aggregate({ _max: { sortOrder: true } });
    const module = await prisma.appModule.create({
      data: {
        type: d.type || 'custom',
        refId: d.refId || null,
        label: d.label || 'Untitled',
        labelAr: d.labelAr || null,
        icon: d.icon || null,
        color: d.color || null,
        link: d.link || null,
        visible: d.visible !== undefined ? !!d.visible : true,
        locked: !!d.locked,
        comingSoon: !!d.comingSoon,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    res.json(module);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/admin/modules/:id', ...admin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  try {
    const module = await prisma.appModule.update({
      where: { id },
      data: {
        ...(d.type !== undefined && { type: d.type }),
        ...(d.refId !== undefined && { refId: d.refId || null }),
        ...(d.label !== undefined && { label: d.label }),
        ...(d.labelAr !== undefined && { labelAr: d.labelAr || null }),
        ...(d.icon !== undefined && { icon: d.icon || null }),
        ...(d.color !== undefined && { color: d.color || null }),
        ...(d.link !== undefined && { link: d.link || null }),
        ...(d.visible !== undefined && { visible: !!d.visible }),
        ...(d.locked !== undefined && { locked: !!d.locked }),
        ...(d.comingSoon !== undefined && { comingSoon: !!d.comingSoon }),
        ...(d.sortOrder !== undefined && { sortOrder: parseInt(d.sortOrder) }),
      },
    });
    res.json(module);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/admin/modules/:id', ...admin, async (req: Request, res: Response) => {
  try {
    await prisma.appModule.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Bulk reorder: body { order: [id, id, ...] } in the desired display order.
router.put('/admin/modules-reorder', ...admin, async (req: Request, res: Response) => {
  const order: string[] = req.body.order || [];
  try {
    await prisma.$transaction(order.map((id, i) => prisma.appModule.update({ where: { id }, data: { sortOrder: i } })));
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Auto-populate tiles from the verticals + their live categories. Idempotent-ish:
// only adds tiles that don't already exist (matched by type + refId).
router.post('/admin/modules/sync', ...admin, async (_req: Request, res: Response) => {
  try {
    const existing = await prisma.appModule.findMany();
    const has = (type: string, refId: string | null) =>
      existing.some((m) => m.type === type && (m.refId ?? null) === (refId ?? null));

    const toCreate: any[] = [];
    let order = (await prisma.appModule.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0;

    // The 4 verticals
    const verticals: { type: string; label: string; icon: string }[] = [
      { type: 'taxi', label: 'Taxi', icon: '🚕' },
      { type: 'food', label: 'Food', icon: '🍕' },
      { type: 'services', label: 'Services', icon: '🔧' },
      { type: 'truck', label: 'Truck', icon: '🚚' },
    ];
    for (const v of verticals) {
      if (!has(v.type, null)) toCreate.push({ type: v.type, label: v.label, icon: v.icon, sortOrder: ++order });
    }
    // Service categories
    const serviceCats = await prisma.category.findMany();
    for (const c of serviceCats) {
      if (!has('service_category', c.id)) toCreate.push({ type: 'service_category', refId: c.id, label: c.name, icon: c.image, sortOrder: ++order });
    }
    // Truck categories
    const truckCats = await prisma.truckCategory.findMany();
    for (const c of truckCats) {
      if (!has('truck_category', c.id)) toCreate.push({ type: 'truck_category', refId: c.id, label: c.name, icon: c.image, sortOrder: ++order });
    }
    if (toCreate.length) await prisma.appModule.createMany({ data: toCreate });
    const modules = await prisma.appModule.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ added: toCreate.length, modules });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Slides ──
router.get('/admin/slides', ...admin, async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const slides = await prisma.appSlide.findMany({
    where: type ? { type } : undefined,
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json(slides);
});

router.post('/admin/slides', ...admin, async (req: Request, res: Response) => {
  const d = req.body;
  if (!d.image) { res.status(400).json({ error: 'An image is required' }); return; }
  try {
    const max = await prisma.appSlide.aggregate({ _max: { sortOrder: true }, where: { type: d.type || 'home' } });
    const slide = await prisma.appSlide.create({
      data: {
        type: d.type || 'home',
        title: d.title || null,
        subtitle: d.subtitle || null,
        image: d.image,
        link: d.link || null,
        promoCodeId: d.promoCodeId || null,
        visible: d.visible !== undefined ? !!d.visible : true,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    });
    res.json(slide);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/admin/slides/:id', ...admin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  try {
    const slide = await prisma.appSlide.update({
      where: { id },
      data: {
        ...(d.type !== undefined && { type: d.type }),
        ...(d.title !== undefined && { title: d.title || null }),
        ...(d.subtitle !== undefined && { subtitle: d.subtitle || null }),
        ...(d.image !== undefined && { image: d.image }),
        ...(d.link !== undefined && { link: d.link || null }),
        ...(d.promoCodeId !== undefined && { promoCodeId: d.promoCodeId || null }),
        ...(d.visible !== undefined && { visible: !!d.visible }),
        ...(d.sortOrder !== undefined && { sortOrder: parseInt(d.sortOrder) }),
      },
    });
    res.json(slide);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/admin/slides/:id', ...admin, async (req: Request, res: Response) => {
  try {
    await prisma.appSlide.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Legal / support pages ──
router.get('/admin/legal', ...admin, async (_req: Request, res: Response) => {
  const pages = await prisma.appLegalPage.findMany();
  // Return all four, filling blanks for any not yet created.
  const byslug = new Map(pages.map((p) => [p.slug, p]));
  res.json(LEGAL_SLUGS.map((slug) => byslug.get(slug) || { slug, title: LEGAL_TITLES[slug], content: '', updatedAt: null }));
});

router.put('/admin/legal/:slug', ...admin, async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  if (!LEGAL_SLUGS.includes(slug)) { res.status(400).json({ error: 'Unknown page' }); return; }
  const d = req.body;
  try {
    const page = await prisma.appLegalPage.upsert({
      where: { slug },
      update: { title: d.title || LEGAL_TITLES[slug], content: d.content || '' },
      create: { slug, title: d.title || LEGAL_TITLES[slug], content: d.content || '' },
    });
    res.json(page);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Notifications ──
router.get('/admin/notifications', ...admin, async (_req: Request, res: Response) => {
  const items = await prisma.appNotification.findMany({ orderBy: { sentAt: 'desc' }, take: 100 });
  res.json(items);
});

router.post('/admin/notifications', ...admin, async (req: Request, res: Response) => {
  const d = req.body;
  if (!d.title || !d.body) { res.status(400).json({ error: 'Title and body are required' }); return; }
  // Channels: prefer the array; fall back to the legacy single "channel" ("both" = app+email).
  let channels: string[] = Array.isArray(d.channels) ? d.channels : [];
  if (!channels.length && d.channel) channels = d.channel === 'both' ? ['app', 'email'] : [d.channel];
  channels = channels.filter((c) => ['app', 'email', 'push'].includes(c));
  if (!channels.length) channels = ['app'];
  const audience = ['all', 'clients', 'workers', 'drivers'].includes(d.audience) ? d.audience : 'all';

  const wantEmail = channels.includes('email');
  const wantPush = channels.includes('push');
  const mailConfigured = isMailEnabled();
  const pushConfigured = isPushEnabled();
  const role = roleWhere(audience);

  try {
    // ── Email fan-out ──
    let sentCount = 0, failedCount = 0, recipientCount = 0, mailError = '';
    if (wantEmail && mailConfigured) {
      const users = await prisma.user.findMany({ where: role, select: { email: true } });
      const recipients = users.map((u) => u.email).filter(Boolean);
      recipientCount = recipients.length;
      const html = emailShell(d.title, `<p style="color:#334155;line-height:1.6">${(d.body as string).replace(/\n/g, '<br/>')}</p>${d.link ? `<p><a href="${d.link}" style="color:#0F766E;font-weight:700">Open</a></p>` : ''}`);
      for (const to of recipients) {
        try { await sendMail({ to, subject: d.title, html }); sentCount++; }
        catch (e: any) { failedCount++; if (!mailError) mailError = e?.message || 'send failed'; }
      }
    }

    // ── Push fan-out ──
    let pushTargets = 0, pushSent = 0, pushFailed = 0;
    if (wantPush && pushConfigured) {
      // 'all' → every device; otherwise only devices linked to a user with that role.
      const where = audience === 'all' ? {} : { user: { is: role } };
      const rows = await prisma.deviceToken.findMany({ where, select: { token: true } });
      const tokens = rows.map((r) => r.token);
      pushTargets = tokens.length;
      const pr = await sendPush(tokens, { title: d.title, body: d.body, ...(d.link ? { data: { link: d.link } } : {}) });
      pushSent = pr.sent; pushFailed = pr.failed;
      if (pr.invalidTokens.length) await prisma.deviceToken.deleteMany({ where: { token: { in: pr.invalidTokens } } });
    }

    const notif = await prisma.appNotification.create({
      data: {
        title: d.title, body: d.body, channel: channels.join(','), audience,
        imageUrl: d.imageUrl || null, link: d.link || null, sentCount: sentCount + pushSent,
      },
    });
    res.json({
      ...notif, channels, wantEmail, wantPush, mailConfigured, pushConfigured,
      recipientCount, sentCount, failedCount, mailError: mailError || undefined,
      pushTargets, pushSent, pushFailed,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Send ONE test email and surface the real result/error, so SMTP config can be verified.
router.post('/admin/test-email', ...admin, async (req: Request, res: Response) => {
  const to = (req.body?.to || '').trim();
  if (!to) { res.status(400).json({ error: 'Recipient email is required' }); return; }
  if (!isMailEnabled()) {
    res.json({ ok: false, mailConfigured: false, message: 'MAIL_HOST is not set in the backend .env — email is only logged, not sent. Add SMTP settings and restart the backend.' });
    return;
  }
  try {
    await sendMail({ to, subject: 'Rafik — test email ✅', html: emailShell('It works!', '<p style="color:#334155;line-height:1.6">Your Rafik email settings are working. Password resets and email notifications will now be delivered.</p>') });
    res.json({ ok: true, message: `Test email sent to ${to}. Check the inbox (and the spam folder).` });
  } catch (err: any) {
    console.error('test-email failed:', err);
    res.status(502).json({ ok: false, error: err?.message || 'Send failed', code: err?.code });
  }
});

router.delete('/admin/notifications/:id', ...admin, async (req: Request, res: Response) => {
  try {
    await prisma.appNotification.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

export default router;
