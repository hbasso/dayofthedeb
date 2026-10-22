'use server';

import { updateTag } from 'next/cache';
import { requireSiteSession } from '@/lib/auth';
import { assertStorableEmail, buildRsvpUpdates, RsvpValidationError, writeRsvp } from '@/lib/db/rsvp';
import { getInvitations, GUEST_LIST_TAG } from '@/lib/guest-list';
import { toRosterHousehold, withAnswers } from '@/lib/roster-view';
import { parseSubmitRsvpInput } from '@/lib/rsvp-input';
import type { SubmitRsvpResult } from '@/types/rsvp';

export async function submitRsvp(input: unknown): Promise<SubmitRsvpResult> {
  await requireSiteSession();
  const parsed = parseSubmitRsvpInput(input);
  if (!parsed) return { status: 'invalid' };

  let attemptedWrite = false;
  try {
    const invitation = (await getInvitations()).find((candidate) => candidate.id === parsed.invitationId);
    // One answer per guest: buildRsvpUpdates rejects strangers and duplicates, so equal counts mean full coverage.
    if (!invitation || parsed.answers.length !== invitation.guests.length) return { status: 'invalid' };

    const updates = buildRsvpUpdates(invitation, parsed.answers);
    if (parsed.email) assertStorableEmail(invitation, parsed.email);

    // One transaction, so there is no half-written household to reconcile.
    attemptedWrite = true;
    await writeRsvp(invitation.id, updates, parsed.email ?? null);

    const household = withAnswers(toRosterHousehold(invitation), parsed.answers);
    return {
      status: 'ok',
      household: { ...household, hasEmailOnFile: household.hasEmailOnFile || Boolean(parsed.email) },
    };
  } catch (error) {
    if (error instanceof RsvpValidationError) return { status: 'invalid' };
    console.error('submitRsvp failed', error);
    return { status: 'error' };
  } finally {
    // Refresh whenever the write was attempted, not only when it succeeded. The transaction
    // itself is all-or-nothing, but a lost response leaves the outcome unknown here, and a
    // committed write we believed had failed would otherwise sit behind a week-long cache.
    if (attemptedWrite) updateTag(GUEST_LIST_TAG);
  }
}
