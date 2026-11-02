import Image from 'next/image';
import { stackCards } from '@/config/rsvp-cards';

/**
 * The narrow-screen counterpart to SideCards: a block of lotería cards under the search form,
 * filling the space the gutters would hold on a wide screen. Hidden at xl, where the gutter
 * columns take over, so the two never show at once.
 */
export function LoteriaCardGrid({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`grid grid-cols-2 gap-4 xl:hidden ${className ?? ''}`}>
      {stackCards.map((card) => (
        <Image
          key={card.id}
          src={card.src}
          alt=""
          sizes="(min-width: 640px) 240px, 45vw"
          placeholder="blur"
          style={{ transform: `rotate(${card.tilt}deg)` }}
          className="w-full rounded-lg shadow-md shadow-foreground/15"
        />
      ))}
    </div>
  );
}
