import { PlusOneField } from '@/components/rsvp/plus-one-field';
import { YesNoToggle } from '@/components/rsvp/yes-no-toggle';
import type { GuestAnswerState, RosterAction, RosterIssue } from '@/lib/roster-state';
import type { RosterGuest } from '@/types/rsvp';

interface GuestRowProps {
  guest: RosterGuest;
  answer: GuestAnswerState;
  issue?: RosterIssue['problem'];
  dispatch: (action: RosterAction) => void;
}

export function GuestRow({ guest, answer, issue, dispatch }: GuestRowProps) {
  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4">
      <YesNoToggle
        name={`attending-${guest.id}`}
        legend={guest.name}
        legendClassName="text-lg font-semibold"
        value={answer.attending}
        yesLabel="Attending"
        noLabel="Can't make it"
        onChange={(attending) => dispatch({ type: 'setAttending', guestId: guest.id, attending })}
        error={issue === 'unanswered' ? `Please choose an answer for ${guest.name}.` : undefined}
      />
      {guest.hasPlusOne && answer.attending === 'yes' && (
        <PlusOneField
          guestId={guest.id}
          guestName={guest.name}
          bringingGuest={answer.bringingGuest}
          plusOneName={answer.plusOneName}
          showNameError={issue === 'missing-guest-name'}
          onBringingGuestChange={(bringingGuest) =>
            dispatch({ type: 'setBringingGuest', guestId: guest.id, bringingGuest })
          }
          onPlusOneNameChange={(plusOneName) => dispatch({ type: 'setPlusOneName', guestId: guest.id, plusOneName })}
        />
      )}
    </li>
  );
}
