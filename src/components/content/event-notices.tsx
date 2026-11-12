import { directionsConfig } from '@/config/directions';

/**
 * Valet reads as a notice rather than an arrival option: a guest who plans to hand over their keys
 * needs to know before they drive downtown, not after they expand an accordion. Only its absence
 * earns a block -- if valet is ever offered it belongs beside the parking garages.
 */
function valetNotice() {
  const { valet } = directionsConfig;
  if (valet.available !== false) return null;
  return {
    title: 'No valet parking',
    body: valet.details ?? 'Valet is not offered at the venue. Take a rideshare or park in one of the garages above.',
  };
}

export function EventNotices() {
  const valet = valetNotice();
  const notices = valet ? [valet, ...directionsConfig.notices] : directionsConfig.notices;
  if (notices.length === 0) return null;

  return (
    <section aria-labelledby="notices-heading" className="space-y-3">
      <h2 id="notices-heading" className="sr-only">
        Before you set out
      </h2>
      {notices.map((notice, index) => (
        <div key={`${index}-${notice.title}`} className="rounded-xl border-2 border-secondary bg-card p-4">
          <p className="text-lg font-semibold">{notice.title}</p>
          <p className="text-base">{notice.body}</p>
        </div>
      ))}
    </section>
  );
}
