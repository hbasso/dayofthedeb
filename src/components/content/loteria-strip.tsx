import Image from 'next/image';
import { loteriaCards } from '@/config/loteria-cards';

export function LoteriaStrip() {
  return (
    // No visible heading: these close the page as a flourish rather than introducing a section,
    // and a label above them would be the filler the page does not need. Screen readers still
    // get one.
    <section aria-labelledby="loteria-heading">
      <h2 id="loteria-heading" className="sr-only">
        Lotería cards for the party
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {loteriaCards.map((card) => (
          <li key={card.id}>
            <Image
              src={card.src}
              alt={card.alt}
              placeholder="blur"
              // Bottom of the page, so these keep next/image's default lazy loading and leave
              // the connection to the hero while it is still the thing on screen.
              sizes="(min-width: 1024px) 160px, (min-width: 640px) 33vw, 50vw"
              className="w-full rounded-lg shadow-md shadow-foreground/15"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
