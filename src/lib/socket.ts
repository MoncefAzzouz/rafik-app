import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { getParticipantRole } from './chatAccess';
import { Role, Message } from '@prisma/client';

interface SocketUser {
  userId: string;
  role: string;
}

let io: Server | null = null;

export function initSocket(httpServer: HttpServer, corsOrigins: string[]) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  // JWT handshake auth — same secret/payload as the REST middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as SocketUser;
      (socket.data as { user: SocketUser }).user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;

    // Admins get a firehose room so the chat monitor updates live
    if (user.role === 'ADMIN') {
      socket.join('admins');
    }

    socket.on('join_conversation', async (conversationId: string, ack?: (ok: boolean, error?: string) => void) => {
      try {
        const participant = await getParticipantRole(conversationId, user.userId, user.role);
        if (!participant) {
          ack?.(false, 'Not a participant of this conversation');
          return;
        }
        socket.join(`conversation:${conversationId}`);
        ack?.(true);
      } catch {
        ack?.(false, 'Server error');
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('send_message', async (
      payload: { conversationId: string; text: string },
      ack?: (ok: boolean, messageOrError?: unknown) => void
    ) => {
      try {
        const { conversationId, text } = payload || {};
        if (!conversationId || !text || !text.trim()) {
          ack?.(false, 'conversationId and text are required');
          return;
        }
        const participant = await getParticipantRole(conversationId, user.userId, user.role);
        if (!participant) {
          ack?.(false, 'Not a participant of this conversation');
          return;
        }
        if (participant === 'admin') {
          ack?.(false, 'Admin is an observer and cannot send messages');
          return;
        }
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { booking: true },
        });
        if (!conversation || conversation.booking.mediationModeSnapshot !== 'DIRECT') {
          ack?.(false, 'Chat is only available for direct-mode bookings');
          return;
        }

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: user.userId,
            senderRole: user.role as Role,
            text: text.trim(),
          },
        });

        emitNewMessage(conversationId, message);
        ack?.(true, message);
      } catch (err) {
        console.error('[socket] send_message error', err);
        ack?.(false, 'Server error');
      }
    });
  });

  return io;
}

// Broadcast a persisted message to its conversation room + admin observers
export function emitNewMessage(conversationId: string, message: Message) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('new_message', message);
  io.to('admins').emit('new_message', message);
}
