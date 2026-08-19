import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: string;
    };
    // Live ban check: a suspended (or deleted) account's token stops working
    // immediately, so the app logs the user out. `code` lets the client detect it.
    const u = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { bannedForever: true, bannedUntil: true },
    });
    if (!u) {
      res.status(401).json({ error: 'Account no longer exists', code: 'no_account' });
      return;
    }
    if (u.bannedForever || (u.bannedUntil && u.bannedUntil > new Date())) {
      res.status(403).json({ error: 'This account has been suspended.', code: 'banned' });
      return;
    }
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
