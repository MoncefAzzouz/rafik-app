// Booking status state machine.
// Mediated flow (admin relays): pending_review → contacting_worker → quote_sent
//   → quote_approved → both_confirmed → dispatched → in_progress → completed
// Direct flow (worker ↔ client):  awaiting_worker → accepted → quote_sent
//   → quote_approved → in_progress → completed

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_review: ['contacting_worker', 'cancelled'],
  contacting_worker: ['quote_sent', 'cancelled'],
  quote_sent: ['quote_approved', 'quote_rejected', 'quote_sent', 'contacting_worker', 'cancelled'],
  quote_rejected: ['contacting_worker', 'quote_sent', 'cancelled'],
  quote_approved: ['both_confirmed', 'in_progress', 'cancelled'],
  both_confirmed: ['dispatched', 'cancelled'],
  dispatched: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  awaiting_worker: ['accepted', 'declined', 'cancelled'],
  accepted: ['quote_sent', 'in_progress', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

export const ALL_STATUSES = Object.keys(ALLOWED_TRANSITIONS);

export function isKnownStatus(status: string): boolean {
  return ALL_STATUSES.includes(status);
}

// Admins may force any known status (to unblock odd situations);
// everyone else must follow the state machine.
export function canTransition(from: string, to: string, isAdmin: boolean): boolean {
  if (!isKnownStatus(to)) return false;
  if (isAdmin) return true;
  const allowed = ALLOWED_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export function newBookingId(): string {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SV-${Date.now().toString(36).toUpperCase()}${rand}`;
}
