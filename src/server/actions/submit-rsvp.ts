'use server';

import { updateTag } from 'next/cache';
import { getAirtableClient } from '@/lib/airtable/client';
import { buildRsvpUpdates, respondedOnDate, RsvpValidationError, writeRsvp } from '@/lib/airtable/rsvp';
import { requireSiteSession } from '@/lib/auth';
import { getInvitations, GUEST_LIST_TAG } from '@/lib/guest-list';
import { toRosterHousehold, withAnswers } from '@/lib/roster-view';
import { parseSubmitRsvpInput } from '@/lib/rsvp-input';
import type { SubmitRsvpResult } from '@/types/rsvp';

export async function submitRsvp(input: unknown): Promise<SubmitRsvpResult> {
  await requireSiteSession();
  const parsed = parseSubmitRsvpInput(input);
  if (!parsed) return { status: 'invalid' };

  try {
    const invitation = (await getInvitations()).find((candidate) => candidate.id === parsed.invitationId);
    // One answer per guest: buildRsvpUpdates rejects strangers and duplicates, so equal counts mean full coverage.
    if (!invitation || parsed.answers.length !== invitation.guests.length) return { status: 'invalid' };

    const updates = buildRsvpUpdates(invitation, parsed.answers, respondedOnDate());
    await writeRsvp(getAirtableClient(), updates);
    updateTag(GUEST_LIST_TAG);

    return { status: 'ok', household: withAnswers(toRosterHousehold(invitation), parsed.answers) };
  } catch (error) {
    if (error instanceof RsvpValidationError) return { status: 'invalid' };
    console.error('submitRsvp failed', error);
    return { status: 'error' };
  }
}
