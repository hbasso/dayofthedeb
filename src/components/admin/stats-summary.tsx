import type { ResponseStats } from '@/lib/admin/stats';
import { formatEventDate } from '@/lib/dates';

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function StatsSummary({ stats }: { stats: ResponseStats }) {
  const lastResponse = formatEventDate(stats.lastResponseDate);
  const tiles = [
    {
      label: 'Households responded',
      value: `${stats.householdsResponded} of ${stats.totalHouseholds}`,
      detail: `${percent(stats.householdsResponded, stats.totalHouseholds)}% of invitations`,
    },
    {
      label: 'Guests',
      value: `${stats.attendingGuests} yes · ${stats.declinedGuests} no`,
      detail: `${stats.awaitingGuests} awaiting (${stats.guestsResponded} of ${stats.totalGuests} answered)`,
    },
    {
      label: 'Plus-ones',
      value: `${stats.plusOnesComing} coming`,
      detail: `of ${stats.plusOnesOffered} offered`,
    },
    {
      label: 'Households active in last 7 days',
      value: `${stats.householdsRespondedLast7Days} ${stats.householdsRespondedLast7Days === 1 ? 'household' : 'households'}`,
      detail: lastResponse ? `Latest response ${lastResponse}` : 'No responses yet',
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="space-y-4">
      <h2 id="stats-heading" className="sr-only">
        Response summary
      </h2>
      <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
        <p className="text-base font-semibold">People coming</p>
        <p className="font-display text-7xl leading-none">{stats.headcount}</p>
        <p className="mt-2 text-base">
          {stats.attendingGuests} {stats.attendingGuests === 1 ? 'guest' : 'guests'} + {stats.plusOnesComing}{' '}
          {stats.plusOnesComing === 1 ? 'plus-one' : 'plus-ones'}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{tile.value}</dd>
            <dd className="text-sm text-muted-foreground">{tile.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
