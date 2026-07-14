import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { emitNewMessage } from '../lib/socket';
import { getParticipantRole } from '../lib/chatAccess';

const router = Router();

function getUser(req: Request) {
  return (req as AuthenticatedRequest).user!;
}

// GET conversations — role-scoped (admin: all, worker: own bookings, client: own)
router.get('/conversations', authenticateToken, async (req: Request, res: Response) => {
  const user = getUser(req);
  try {
    let where = {};
    if (user.role === 'WORKER') {
      const pro = await prisma.professional.findUnique({ where: { userId: user.userId } });
      if (!pro) {
        res.json([]);
        return;
      }
      where = { booking: { workerId: pro.id } };
    } else if (user.role === 'CLIENT') {
      where = { booking: { clientId: user.userId } };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true, clientName: true, clientPhone: true, serviceCategory: true,
            status: true, workerId: true, clientId: true,
            worker: { select: { name: true, userId: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Unread count per conversation (messages from the other party without readAt)
    const result = await Promise.all(conversations.map(async (c) => {
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          readAt: null,
          ...(user.role !== 'ADMIN' && { NOT: { senderId: user.userId } }),
        },
      });
      return { ...c, lastMessage: c.messages[0] ?? null, unread, messages: undefined };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET message history (participants + admin observer)
router.get('/conversations/:id/messages', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  const { before, limit } = req.query as { before?: string; limit?: string };
  try {
    const participant = await getParticipantRole(id, user.userId, user.role);
    if (!participant) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit || '50'), 100),
    });

    // Mark the other party's messages as read for participants
    if (participant === 'client' || participant === 'worker') {
      await prisma.message.updateMany({
        where: { conversationId: id, readAt: null, NOT: { senderId: user.userId } },
        data: { readAt: new Date() },
      });
    }

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST send a message (participants only — admin is a read-only observer).
// REST fallback for when the socket is unavailable; also broadcasts via socket.
router.post('/conversations/:id/messages', authenticateToken, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = getUser(req);
  const { text } = req.body;

  if (!text || !`${text}`.trim()) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  try {
    const participant = await getParticipantRole(id, user.userId, user.role);
    if (!participant) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (participant === 'admin') {
      res.status(403).json({ error: 'Admin is an observer in direct mode and cannot send messages' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { booking: true },
    });
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    if (conversation.booking.mediationModeSnapshot !== 'DIRECT') {
      res.status(403).json({ error: 'Chat is only available for direct-mode bookings' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.userId,
        senderRole: user.role as Role,
        text: `${text}`.trim(),
      },
    });

    emitNewMessage(id, message);
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
