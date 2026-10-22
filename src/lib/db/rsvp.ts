import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { getDb } from '@/lib/db/client';
import { guests, invitations } from '@/lib/db/schema';
import { isLikelyEmail } from '@/lib/email';
import { MAX_PLUS_ONE_NAME_LENGTH, storedPlusOneName } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';
import type { RsvpAnswer } from '@/types/rsvp';

export class RsvpValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RsvpValidationError';
  }
}

export interface GuestUpdate {
  id: string;
  attending: 'yes' | 'no';
  /** undefined leaves the column alone; null clears it. Only guests offered a plus-one get one. */
  plusOneName?: string | null;
}

/**
 * Validates answers against the household the server loaded, not the one the browser claims, and
 * maps them to guest updates. A crafted request naming someone else's guest id is rejected here.
 */
export function buildRsvpUpdates(invitation: Invitation, answers: readonly RsvpAnswer[]): GuestUpdate[] {
  if (!Array.isArray(answers)) {
    throw new RsvpValidationError('answers must be an array');
  }

  const guestsById = new Map(invitation.guests.map((guest) => [guest.id, guest]));
  const answered = new Set<string>();

  return answers.map((answer) => {
    if (answer === null || typeof answer !== 'object') {
      throw new RsvpValidationError('Each answer must be an object');
    }
    if (typeof answer.guestId !== 'string') {
      throw new RsvpValidationError('guestId must be a string');
    }
    if (answer.plusOneName !== undefined && typeof answer.plusOneName !== 'string') {
      throw new RsvpValidationError('plusOneName must be a string');
    }
    const guest = guestsById.get(answer.guestId);
    if (!guest) throw new RsvpValidationError(`Guest ${answer.guestId} is not on invitation ${invitation.id}`);
    if (answered.has(guest.id)) throw new RsvpValidationError(`Duplicate answer for guest ${guest.id}`);
    answered.add(guest.id);
    if (answer.attending !== 'yes' && answer.attending !== 'no') {
      throw new RsvpValidationError(`Invalid attendance for guest ${guest.id}`);
    }

    if (!guest.hasPlusOne) return { id: guest.id, attending: answer.attending };

    if ((answer.plusOneName?.trim() ?? '').length > MAX_PLUS_ONE_NAME_LENGTH) {
      throw new RsvpValidationError(`Plus-one name for guest ${guest.id} is too long`);
    }
    return {
      id: guest.id,
      attending: answer.attending,
      plusOneName: storedPlusOneName(true, answer.attending, answer.plusOneName),
    };
  });
}

/** Defence in depth: the email was validated on the way in, and again before it is stored. */
export function assertStorableEmail(invitation: Invitation, email: string): void {
  if (!isLikelyEmail(email)) {
    throw new RsvpValidationError(`Email for invitation ${invitation.id} is not a valid email`);
  }
}

/**
 * One transaction for the whole household, and the email with it. Airtable had to write in
 * batches of ten, so a failure halfway could leave a household half-answered; here either every
 * row lands or none does, which is why the caller no longer tracks whether a write had started.
 */
export async function writeRsvp(
  invitationId: string,
  updates: readonly GuestUpdate[],
  email: string | null,
  respondedAt: Date = new Date(),
): Promise<void> {
  const db = getDb();

  // Typed as BatchItem so the guest updates and the invitation update can share one array.
  const statements: BatchItem<'pg'>[] = updates.map((update) =>
    db
      .update(guests)
      .set({
        attending: update.attending,
        respondedAt,
        ...(update.plusOneName !== undefined ? { plusOneName: update.plusOneName } : {}),
      })
      // The invitation id is in the WHERE as well as the ownership check above: one belt, one
      // brace, and the database refuses to touch another household's row either way.
      .where(and(eq(guests.id, update.id), eq(guests.invitationId, invitationId)))
      // Returning the id is how we find out the row was actually there. An UPDATE that matches
      // nothing is a successful statement, so without this a guest whose record was deleted in
      // the console since their page loaded would be told their RSVP saved.
      .returning({ id: guests.id }),
  );

  if (email) {
    statements.push(
      db
        .update(invitations)
        .set({ contactEmail: email })
        .where(eq(invitations.id, invitationId))
        .returning({ id: invitations.id }),
    );
  }
  if (statements.length === 0) return;

  // drizzle's batch() types demand a non-empty tuple; the guard above is what makes this safe.
  const results = (await db.batch(statements as [BatchItem<'pg'>, ...BatchItem<'pg'>[]])) as { id: string }[][];

  const guestsWritten = results.slice(0, updates.length).reduce((total, rows) => total + rows.length, 0);
  if (guestsWritten !== updates.length) {
    throw new RsvpValidationError(
      `Expected to update ${updates.length} guests on invitation ${invitationId}, matched ${guestsWritten}`,
    );
  }
}
