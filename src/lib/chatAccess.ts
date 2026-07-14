import prisma from './prisma';

export type ChatRole = 'client' | 'worker' | 'admin' | null;

// Who is this user within the conversation's booking?
// admin = read-only observer; client/worker = participants who can send.
export async function getParticipantRole(
  conversationId: string,
  userId: string,
  role: string
): Promise<ChatRole> {
  if (role === 'ADMIN') return 'admin';
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { booking: { include: { worker: true } } },
  });
  if (!conversation) return null;
  if (conversation.booking.clientId === userId) return 'client';
  if (conversation.booking.worker.userId === userId) return 'worker';
  return null;
}
