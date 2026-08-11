import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();
const admin = [authenticateToken, requireRole('ADMIN')];

const ROLES = ['ADMIN', 'WORKER', 'CLIENT', 'RESTAURANT', 'DRIVER', 'CASHIER', 'TRUCKER'];

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

// Never leak the password hash.
function serialize(u: any) {
  const { passwordHash, ...rest } = u;
  const now = new Date();
  const isBanned = u.bannedForever || (u.bannedUntil && new Date(u.bannedUntil) > now);
  return { ...rest, isBanned };
}

// ── List users (search + role filter) ──
router.get('/', ...admin, async (req: Request, res: Response) => {
  const { role, search } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        ...(role && ROLES.includes(role as string) && { role: role as any }),
        ...(search && {
          OR: [
            { fullName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: { professional: { select: { id: true, category: true, verified: true } } },
    });
    res.json(users.map(serialize));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Create a user (any role) ──
router.post('/', ...admin, async (req: Request, res: Response) => {
  const { email, phone, password, fullName, role, wilaya, commune, address } = req.body;
  if (!email || !phone || !password || !fullName) {
    res.status(400).json({ error: 'email, phone, password and fullName are required' });
    return;
  }
  if (role && !ROLES.includes(role)) { res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` }); return; }
  if (String(password).length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
  try {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) { res.status(409).json({ error: 'A user with this email or phone already exists' }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.trim(), phone: phone.trim(), passwordHash, fullName: fullName.trim(),
        role: (role as any) || 'CLIENT',
        wilaya: wilaya || null, commune: commune || null, address: address || null,
      },
    });
    res.status(201).json(serialize(user));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Edit a user's info ──
router.put('/:id', ...admin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const d = req.body;
  if (d.role && !ROLES.includes(d.role)) { res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` }); return; }
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(d.fullName !== undefined && { fullName: (d.fullName as string).trim() }),
        ...(d.email !== undefined && { email: (d.email as string).trim() }),
        ...(d.phone !== undefined && { phone: (d.phone as string).trim() }),
        ...(d.role !== undefined && { role: d.role }),
        ...(d.wilaya !== undefined && { wilaya: d.wilaya || null }),
        ...(d.commune !== undefined && { commune: d.commune || null }),
        ...(d.address !== undefined && { address: d.address || null }),
        ...(d.profileImage !== undefined && { profileImage: d.profileImage || null }),
      },
    });
    res.json(serialize(user));
  } catch (err: any) {
    if (err?.code === 'P2002') { res.status(409).json({ error: 'Email or phone already in use' }); return; }
    if (err?.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ── Reset a user's password ──
router.put('/:id/password', ...admin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { password } = req.body;
  if (!password || String(password).length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.json({ success: true });
  } catch (err: any) {
    if (err?.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ── Ban / suspend a user ──
// body: { mode: "forever" | "until" | "unban", until?: ISO date, reason?: string }
router.put('/:id/ban', ...admin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { mode, until, reason } = req.body;
  const me = getUser(req);
  if (id === me.userId) { res.status(400).json({ error: "You can't ban your own account" }); return; }
  try {
    let data: any;
    if (mode === 'forever') data = { bannedForever: true, bannedUntil: null, banReason: reason || null };
    else if (mode === 'until') {
      const d = until ? new Date(until) : null;
      if (!d || isNaN(d.getTime())) { res.status(400).json({ error: 'A valid "until" date is required' }); return; }
      data = { bannedForever: false, bannedUntil: d, banReason: reason || null };
    } else if (mode === 'unban') data = { bannedForever: false, bannedUntil: null, banReason: null };
    else { res.status(400).json({ error: 'mode must be forever, until, or unban' }); return; }
    const user = await prisma.user.update({ where: { id }, data });
    res.json(serialize(user));
  } catch (err: any) {
    if (err?.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ── Delete a user ──
router.delete('/:id', ...admin, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const me = getUser(req);
  if (id === me.userId) { res.status(400).json({ error: "You can't delete your own account" }); return; }
  try {
    // Detach a linked professional profile if it has no bookings (else block — ban instead).
    const professional = await prisma.professional.findUnique({ where: { userId: id } });
    if (professional) {
      const bookingCount = await prisma.booking.count({ where: { workerId: professional.id } });
      if (bookingCount > 0) {
        res.status(409).json({ error: 'This worker has bookings on record. Ban the account instead of deleting it.' });
        return;
      }
      await prisma.professional.delete({ where: { id: professional.id } });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    if (err?.code === 'P2003') { res.status(409).json({ error: 'This user has related records (orders, trucks…). Ban the account instead.' }); return; }
    if (err?.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

export default router;
