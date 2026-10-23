import { buttonClass } from '@/lib/button-class';

const downloads = [
  {
    href: '/api/export',
    label: 'Download headcount CSV',
    variant: 'default' as const,
    description:
      'One row per person actually coming, and each plus-one gets their own row, so the row count is the headcount. Declines and guests who have not replied are left out. No contact details, so this is the one to hand to the venue.',
  },
  {
    href: '/api/export?scope=all',
    label: 'Download full guest list CSV',
    variant: 'outline' as const,
    description:
      'Every invited guest with their status: attending, declined, or no reply yet. Plus-one names sit in a column rather than their own row, so this row count is not the headcount. Includes household email addresses, so keep this copy rather than forwarding it.',
  },
];

export function ExportButtons() {
  return (
    <section aria-labelledby="export-heading" className="space-y-3">
      <h2 id="export-heading" className="font-display text-2xl">
        Downloads
      </h2>
      {/* Each description sits under its own button: two buttons followed by two paragraphs left
          the reader matching them up, and these two files are easy to confuse. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {downloads.map((download) => (
          <div key={download.href} className="space-y-2">
            <a
              href={download.href}
              download
              className={buttonClass({ variant: download.variant, className: 'h-11 w-full px-4 text-base' })}
            >
              {download.label}
            </a>
            <p className="text-sm text-muted-foreground">{download.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
