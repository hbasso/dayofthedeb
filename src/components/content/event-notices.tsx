import { directionsConfig } from '@/config/directions';

export function EventNotices() {
  if (directionsConfig.notices.length === 0) return null;

  return (
    <section aria-labelledby="notices-heading" className="space-y-3">
      <h2 id="notices-heading" className="sr-only">
        Event-day notices
      </h2>
      {directionsConfig.notices.map((notice, index) => (
        <div key={`${index}-${notice.title}`} className="rounded-xl border-2 border-secondary bg-card p-4">
          <p className="text-lg font-semibold">{notice.title}</p>
          <p className="text-base">{notice.body}</p>
        </div>
      ))}
    </section>
  );
}
