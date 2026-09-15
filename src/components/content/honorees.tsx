import { LoteriaCard } from '@/components/loteria/loteria-card';
import { honorees } from '@/config/honorees';
import { siteConfig } from '@/config/site';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function Honorees() {
  const { count } = siteConfig.honorees;
  const countWord = NUMBER_WORDS[count] ?? String(count);

  return (
    <section aria-labelledby="honorees-heading" className="space-y-6 text-center">
      <h2 id="honorees-heading" className="font-display text-3xl">
        Celebrating our {countWord} débutantes
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {honorees.map((honoree) => (
          <li key={honoree.number}>
            <LoteriaCard
              number={honoree.number}
              title={honoree.name ?? 'La Debutante'}
              subtitle={honoree.name ? undefined : 'Name to be announced'}
              image={honoree.image ?? undefined}
              palette={honoree.palette}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
