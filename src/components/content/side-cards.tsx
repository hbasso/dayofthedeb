import Image from 'next/image';
import { sideCards } from '@/config/rsvp-cards';

function Column({ cards, side }: { cards: typeof sideCards.left; side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      // Anchored to the edge of the content column rather than to the screen, so the cards sit
      // just outside the form and leave the far gutter empty however wide the monitor is.
      // z-10 puts the column in front of the papel picado, so a run can simply end behind a card
      // instead of being faded out. The cards are earlier in the DOM, so without this they lose.
      className={`absolute top-4 z-10 hidden w-40 space-y-8 xl:block ${
        side === 'left' ? 'right-full mr-12' : 'left-full ml-12'
      }`}
    >
      {cards.map((card) => (
        <Image
          key={card.id}
          src={card.src}
          alt=""
          sizes="160px"
          placeholder="blur"
          style={{ transform: `rotate(${card.tilt}deg)` }}
          className="w-full rounded-lg shadow-md shadow-foreground/15"
        />
      ))}
    </div>
  );
}

/** Decoration for the empty gutters beside the RSVP form. Hidden below xl, where there are none. */
export function SideCards() {
  return (
    <>
      <Column cards={sideCards.left} side="left" />
      <Column cards={sideCards.right} side="right" />
    </>
  );
}
