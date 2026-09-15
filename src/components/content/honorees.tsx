import Image from 'next/image';
import { debCards } from '@/config/deb-cards';
import { siteConfig } from '@/config/site';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function Honorees() {
  const { count } = siteConfig.honorees;
  const countWord = NUMBER_WORDS[count] ?? String(count);

  return (
    // The heading is visually hidden: on the hero the cards speak for themselves,
    // but screen readers still need to know what this group of cards is.
    <section aria-labelledby="honorees-heading">
      <h2 id="honorees-heading" className="sr-only">
        Celebrating our {countWord} débutantes
      </h2>
      {/* Flex-wrap, not a grid: a short last row stays centered. */}
      <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {debCards.map((card) => (
          <li
            key={card.id}
            className="w-[calc(50%-0.375rem)] max-w-44 sm:w-[calc(33.333%-0.667rem)] sm:max-w-52 lg:w-[calc(16.666%-0.834rem)] lg:max-w-56"
          >
            <Image
              src={card.src}
              alt={card.alt}
              sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
              className="h-auto w-full rounded-sm shadow-lg shadow-black/30"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
