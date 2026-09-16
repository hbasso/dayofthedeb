/**
 * Placeholder result cards shown while a search is in flight. Shaped like ResultCard — a
 * household line over a members line — so the real results land in the same place rather
 * than shifting the page. Decorative: the form announces the search to screen readers.
 */
export function SearchSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      {[0, 1].map((row) => (
        <div key={row} className="animate-pulse rounded-xl border-2 border-border bg-card p-4">
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
