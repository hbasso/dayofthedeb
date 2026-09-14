import type { DuplicateName } from '@/lib/admin/guest-rows';

export function DuplicateNames({ duplicates }: { duplicates: DuplicateName[] }) {
  return (
    <section aria-labelledby="duplicates-heading" className="rounded-xl border-2 border-secondary bg-card p-4">
      <h2 id="duplicates-heading" className="text-lg font-semibold">
        Same name in more than one household
      </h2>
      <p className="text-sm text-muted-foreground">
        Guests choose their household by its name and members, so make sure these household names are easy to tell apart.
      </p>
      <ul className="mt-3 space-y-1">
        {duplicates.map((duplicate) => (
          <li key={duplicate.name}>
            <span className="font-medium">{duplicate.name}</span>: {duplicate.households.join(', ')}
          </li>
        ))}
      </ul>
    </section>
  );
}
