import type { CSSProperties } from 'react';
import Image from 'next/image';
import { isHexColor, readableInk } from '@/lib/loteria-colors';

export interface LoteriaCardPalette {
  /** Art background. The title sits on it, so it also decides the ink. */
  background?: string;
  /** Number, title and keyline. Defaults to whichever reads on `background`. */
  ink?: string;
  /** The paper margin around the art. */
  paper?: string;
}

export interface LoteriaCardProps {
  title: string;
  /** Leave out until the photo exists; the frame then shows a placeholder line. */
  image?: { src: string; alt: string };
  number?: number | string;
  palette?: LoteriaCardPalette;
  /** Shows the ® mark like Don Clemente cards. Default false. */
  registered?: boolean;
  /** How the art sits in its frame. Default 'cover'. */
  fit?: 'cover' | 'contain';
  /** Shown in the frame when there is no image yet. */
  placeholderLabel?: string;
  className?: string;
}

// Card-art colors, not theme tokens: these style the illustration inside the
// card, not the site chrome, so the "colors only via semantic tokens" rule
// (which governs the site theme) doesn't apply here.
const DEFAULT_PALETTE = {
  background: '#9FD6F2', // lotería sky blue
  paper: '#FFFCF6',
} as const;

function pickColor(value: string | undefined, fallback: string): string {
  return value && isHexColor(value) ? value : fallback;
}

export function LoteriaCard({
  title,
  image,
  number,
  palette,
  registered = false,
  fit = 'cover',
  placeholderLabel = 'Photo to come',
  className,
}: LoteriaCardProps) {
  const background = pickColor(palette?.background, DEFAULT_PALETTE.background);
  const paper = pickColor(palette?.paper, DEFAULT_PALETTE.paper);
  const ink = pickColor(palette?.ink, readableInk(background));

  const style = {
    '--loteria-background': background,
    '--loteria-paper': paper,
    '--loteria-ink': ink,
  } as CSSProperties;

  // The paper is close to the page background, so the shadow is what separates card from page.
  return (
    <figure
      style={style}
      className={`rounded-[2px] bg-[var(--loteria-paper)] p-1.5 shadow-lg shadow-foreground/25 sm:p-2 ${className ?? ''}`}
    >
      {/* One frame holds everything, like the printed card: art, number and title all sit on the same ground. */}
      <div className="@container relative aspect-[5/7] overflow-hidden border-2 border-[var(--loteria-ink)] bg-[var(--loteria-background)]">
        <div className="absolute inset-x-0 top-0 bottom-[15%]">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className={fit === 'contain' ? 'object-contain' : 'object-cover'}
            />
          ) : (
            <p className="font-loteria absolute inset-0 flex items-center justify-center p-3 text-center text-[4cqw] tracking-[0.12em] text-[var(--loteria-ink)] uppercase">
              {placeholderLabel}
            </p>
          )}
        </div>
        {number !== undefined && (
          <span className="font-loteria absolute top-[2%] left-[4%] text-[9cqw] leading-none font-bold tabular-nums text-[var(--loteria-ink)]">
            {number}
          </span>
        )}
        {registered && (
          <span className="absolute top-[3%] right-[4%] text-[4cqw] leading-none text-[var(--loteria-ink)]">®</span>
        )}
        <figcaption className="absolute inset-x-0 bottom-0 flex h-[15%] items-center justify-center px-[3%]">
          <p className="font-loteria w-full text-center text-[clamp(0.55rem,9cqw,2.5rem)] leading-none font-bold tracking-[0.06em] text-balance text-[var(--loteria-ink)] uppercase">
            {title}
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
