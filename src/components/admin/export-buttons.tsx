import { buttonClass } from '@/lib/button-class';

export function ExportButtons() {
  return (
    <section aria-labelledby="export-heading" className="space-y-3">
      <h2 id="export-heading" className="font-display text-2xl">
        Downloads
      </h2>
      <div className="flex flex-wrap gap-3">
        <a href="/api/export" download className={buttonClass({ className: 'h-11 px-4 text-base' })}>
          Download headcount CSV
        </a>
        <a href="/api/export?scope=all" download className={buttonClass({ variant: 'outline', className: 'h-11 px-4 text-base' })}>
          Download full guest list CSV
        </a>
      </div>
      <p className="text-sm text-muted-foreground">
        The headcount file has one row per person coming, plus-ones included, best for the venue. 
      </p>
      <p className="text-sm text-muted-foreground">
        The full list has
        every guest and their response.
      </p>
    </section>
  );
}
