import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { sendMail, emailShell } from '../lib/mailer';

const router = Router();

// Where the emailed reset link points (the public web front). Override with env.
function webBaseUrl() {
  return (process.env.APP_WEB_URL || 'http://5.196.32.222').replace(/\/$/, '');
}
function sha256(v: string) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

function signToken(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}

function serializeUser(user: {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  profileImage?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    profileImage: user.profileImage || null,
  };
}

// ── Single Login (Admin + Worker + Client) ──
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Missing email or password' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Register (mobile clients) ──
router.post('/register', async (req: Request, res: Response) => {
  const { email, phone, password, fullName } = req.body;
  if (!email || !phone || !password || !fullName) {
    res.status(400).json({ error: 'Missing required fields (email, phone, password, fullName)' });
    return;
  }
  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });
    if (existing) {
      res.status(409).json({ error: 'User with this email or phone already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, phone, passwordHash, fullName, role: 'CLIENT' },
    });
    const token = signToken(user.id, user.role);
    res.status(201).json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get current user ──
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(serializeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update own profile ──
router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { fullName, email, phone, profileImage } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(email && { email: email.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(profileImage !== undefined && { profileImage }),
      },
    });
    res.json(serializeUser(user));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Email or phone already in use' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Delete own account ──
router.delete('/delete-account', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    // If this account is a worker, remove the linked professional profile too
    // (reviews cascade; bookings keep the record, so block if any exist)
    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (professional) {
      const bookingCount = await prisma.booking.count({ where: { workerId: professional.id } });
      if (bookingCount > 0) {
        res.status(409).json({ error: 'This worker account has bookings; ask an admin to remove it' });
        return;
      }
      await prisma.professional.delete({ where: { id: professional.id } });
    }
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Forgot password: email a reset link ──
// Always responds 200 with the same message (don't reveal whether an email exists).
router.post('/forgot-password', async (req: Request, res: Response) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const genericOk = { success: true, message: 'If that email exists, a reset link has been sent.' };
  if (!email) { res.status(400).json({ error: 'Email is required' }); return; }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Raw token goes in the email; only its hash is stored.
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = sha256(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      // Invalidate any previous unused tokens for this user.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

      const link = `${webBaseUrl()}/reset-password?token=${rawToken}`;
      const html = emailShell('Reset your password', `
        <p style="color:#334155;line-height:1.6">Hi ${user.fullName || ''}, we received a request to reset your Rafik password.</p>
        <p style="margin:24px 0"><a href="${link}" style="background:#0F766E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;display:inline-block">Set a new password</a></p>
        <p style="color:#64748b;font-size:13px;line-height:1.6">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#94a3b8;font-size:12px;word-break:break-all">${link}</p>`);
      try { await sendMail({ to: email, subject: 'Reset your Rafik password', html }); } catch (e) { console.error('reset mail failed', e); }
    }
    res.json(genericOk);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Validate a reset token (so the web page can show a friendly error early) ──
router.get('/reset-password/:token', async (req: Request, res: Response) => {
  const tokenHash = sha256(req.params.token as string);
  try {
    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    const valid = !!row && !row.usedAt && row.expiresAt > new Date();
    res.json({ valid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Reset password with the emailed token ──
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body || {};
  if (!token || !password) { res.status(400).json({ error: 'Token and new password are required' }); return; }
  if (String(password).length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
  try {
    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ]);
    res.json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
