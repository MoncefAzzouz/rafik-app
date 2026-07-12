import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

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

// ── Send OTP (simulated) ──
router.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;
  console.log(`[OTP] Sending code 1234 to phone: ${phone}`);
  res.json({ success: true, message: 'OTP code sent' });
});

// ── Verify OTP ──
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (code !== '1234') {
    res.status(400).json({ error: 'Invalid verification code' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user) {
      const token = signToken(user.id, user.role);
      res.json({ success: true, token, user: serializeUser(user) });
    } else {
      res.json({ success: true, isNewUser: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Register via phone (after OTP) ──
router.post('/register-phone', async (req: Request, res: Response) => {
  const { fullName, phone, email } = req.body;
  if (!fullName || !phone) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      const token = signToken(existing.id, existing.role);
      res.json({ token, user: serializeUser(existing) });
      return;
    }
    const userEmail = email || `${phone.replace(/\D/g, '')}@rafik.app`;
    const passwordHash = await bcrypt.hash('otp_default_password', 10);
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        phone,
        passwordHash,
        fullName,
        role: 'CLIENT',
      },
    });
    const token = signToken(user.id, user.role);
    res.json({ token, user: serializeUser(user) });
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
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
