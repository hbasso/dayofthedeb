import { ArrowRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A circled arrow pinned to the right edge of a clickable card or button.
 *
 * Guests told us they could not tell the detail cards and ride buttons were tappable, so the
 * affordance is now the same shape in every place: a ring with an arrow, vertically centred on
 * the right edge. It takes its colour from `currentColor`, so one component works on the pink
 * cards and on the cream outline buttons without being told which it is on.
 *
 * The container must establish a positioning context and reserve room so a wrapped label never
 * runs underneath. Which reservation depends on how the label sits: a card's label is left
 * aligned and only needs the right edge kept clear, while a button's is centred, so holding back
 * one side only would leave the text visibly off-centre.
 */
export const clickArrowGap = 'pr-14';
export const clickArrowGapCentered = 'px-14';

export function ClickArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      // pointer-events-none keeps the circle from swallowing the click it is advertising, which
      // matters on the cards, where the real hit area is a stretched ::after on the link.
      className={cn(
        'pointer-events-none absolute top-1/2 right-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-current',
        className,
      )}
    >
      <ArrowRightIcon className="size-4" strokeWidth={4} />
    </span>
  );
}
