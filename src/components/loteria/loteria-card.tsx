import type { CSSProperties } from 'react';
import Image from 'next/image';
import { isHexColor, readableAccent, readableInk } from '@/lib/loteria-colors';

export interface LoteriaCardPalette {
  /** Art background behind the image. */
  background?: string;
  /** Keyline + number + title ink, printed on `paper`. Defaults to whatever reads on the paper. */
  ink?: string;
  /** Paper/margin color. */
  paper?: string;
  /** Small accent used for the subtitle and the rule above the title. */
  accent?: string;
}

export interface LoteriaCardProps {
  title: string;
  /** Leave out until the photo exists; the frame then shows a placeholder panel. */
  image?: { src: string; alt: string };
  number?: number | string;
  subtitle?: string;
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
  accent: '#C2127A',
} as const;

function pickColor(value: string | undefined, fallback: string): string {
  return value && isHexColor(value) ? value : fallback;
}

export function LoteriaCard({
  title,
  image,
  number,
  subtitle,
  palette,
  registered = false,
  fit = 'cover',
  placeholderLabel = 'Photo to come',
  className,
}: LoteriaCardProps) {
  const background = pickColor(palette?.background, DEFAULT_PALETTE.background);
  const paper = pickColor(palette?.paper, DEFAULT_PALETTE.paper);
  const accent = pickColor(palette?.accent, DEFAULT_PALETTE.accent);
  // The title, number and keyline sit on the paper; the ® sits on the art. A dark
  // art background must not bleach the title, so the two inks are chosen separately.
  const ink = pickColor(palette?.ink, readableInk(paper));
  const artInk = readableInk(background);

  const style = {
    '--loteria-background': background,
    '--loteria-paper': paper,
    '--loteria-accent': accent,
    '--loteria-ink': ink,
    '--loteria-art-ink': artInk,
    '--loteria-subtitle': readableAccent(accent, paper, ink),
  } as CSSProperties;

  return (
    <figure
      style={style}
      className={`rounded-sm border-2 border-[var(--loteria-ink)] bg-[var(--loteria-paper)] p-2 sm:p-3 ${className ?? ''}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] border-2 border-[var(--loteria-ink)] bg-[var(--loteria-background)]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={fit === 'contain' ? 'object-contain' : 'object-cover'}
          />
        ) : (
          <p className="font-loteria absolute inset-0 flex items-center justify-center p-4 text-center text-xs tracking-[0.18em] text-[var(--loteria-art-ink)] uppercase">
            {placeholderLabel}
          </p>
        )}
        {number !== undefined && (
          <span className="font-loteria absolute left-1.5 top-1.5 min-w-6 rounded-sm border border-[var(--loteria-ink)] bg-[var(--loteria-paper)] px-1.5 py-0.5 text-center text-sm font-bold tabular-nums text-[var(--loteria-ink)]">
            {number}
          </span>
        )}
        {registered && (
          <span className="absolute right-1.5 top-1.5 text-xs font-bold leading-none text-[var(--loteria-art-ink)]">®</span>
        )}
      </div>
      <figcaption className="pt-2 text-center sm:pt-3">
        <div className="mx-auto mb-2 h-px w-10 bg-[var(--loteria-accent)]" />
        <p className="font-loteria text-balance text-xl font-bold uppercase tracking-[0.18em] text-[var(--loteria-ink)] sm:text-2xl">
          {title}
        </p>
        {subtitle && <p className="mt-1 text-sm text-[var(--loteria-subtitle)]">{subtitle}</p>}
      </figcaption>
    </figure>
  );
}
