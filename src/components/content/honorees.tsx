import { siteConfig } from '@/config/site';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function Honorees() {
  const { count, names } = siteConfig.honorees;
  const countWord = NUMBER_WORDS[count] ?? String(count);

  return (
    <section aria-labelledby="honorees-heading" className="space-y-4 text-center">
      <h2 id="honorees-heading" className="font-display text-3xl">
        Celebrating our {countWord} débutantes
      </h2>
      {names.length > 0 ? (
        <ul className="flex flex-wrap justify-center gap-3">
          {names.map((name) => (
            <li key={name} className="rounded-full bg-secondary px-4 py-2 text-lg font-semibold text-secondary-foreground">
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-lg text-muted-foreground italic">Names to be announced</p>
      )}
    </section>
  );
}
