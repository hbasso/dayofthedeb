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
      {/* Flex-wrap, not a grid: a short last row (5 cards over 2 or 3 columns) stays centered. */}
      <ul className="flex flex-wrap justify-center gap-4">
        {honorees.map((honoree) => (
          <li
            key={honoree.number}
            className="w-[calc(50%-0.5rem)] max-w-56 sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]"
          >
            <LoteriaCard
              number={honoree.number}
              title={honoree.name ?? 'La Debutante'}
              image={honoree.image ?? undefined}
              placeholderLabel={honoree.name ? 'Photo to come' : 'Name and photo to come'}
              palette={honoree.palette}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
