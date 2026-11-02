/**
 * A run of papel picado strung across the page.
 *
 * Drawn rather than imported: cut paper is flat shapes and holes, which is exactly what SVG is,
 * so this costs a couple of kilobytes instead of an image, stays sharp at any size, and takes
 * its colours from the palette rather than from whatever a stock file happened to use.
 *
 * Each flag carries its own sagging length of string from edge to edge, so a row of them draws
 * one continuous scalloped line however many happen to fit on screen.
 */

// Six palette colours, ordered so no two neighbours come from the same family.
const COLORS = [
  'var(--primary)',
  'var(--sunny)',
  'var(--turquoise)',
  'var(--secondary)',
  'var(--link)',
  'var(--success)',
];

/** Enough to cross an ultrawide monitor at ~85px a flag; the row centres and clips the rest. */
const FLAG_COUNT = 48;

const WIDTH = 100;
const HEIGHT = 132;
/** Where the panel stops and the scalloped fringe begins. */
const PANEL_BOTTOM = 104;
const MASK_IDS = ['picado-rosette', 'picado-diamond', 'picado-star'] as const;

const STRING_PATH = `M0 5 Q ${WIDTH / 2} 15 ${WIDTH} 5`;
const PANEL_PATH = `${STRING_PATH} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;

/** The grid of square holes bordering every flag, as in the cut-paper originals. */
function Lattice() {
  const holes = [];
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      // The middle stays clear for the motif; the border keeps its grid.
      if (row >= 1 && row <= 3 && column >= 2 && column <= 4) continue;
      holes.push(
        <rect key={`${row}-${column}`} x={10 + column * 11.5} y={16 + row * 15} width={7} height={9} rx={1.5} />,
      );
    }
  }
  return <>{holes}</>;
}

/** Rounded tabs along the bottom edge, each with a teardrop swinging beneath it. */
function Fringe() {
  return (
    <g fill="#fff">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <circle cx={10 + i * 20} cy={PANEL_BOTTOM} r={10} />
          <rect x={9 + i * 20} y={PANEL_BOTTOM} width={2} height={16} />
          <circle cx={10 + i * 20} cy={PANEL_BOTTOM + 16} r={4} />
        </g>
      ))}
    </g>
  );
}

/**
 * The three cut patterns, defined once for the whole row. Masks are referenced by id, so every
 * flag of a given variant shares one definition instead of repeating it 32 times.
 */
function PicadoMasks() {
  return (
    <svg aria-hidden width={0} height={0} className="absolute" focusable="false">
      <defs>
        {MASK_IDS.map((id, variant) => (
          <mask key={id} id={id}>
            {/* White keeps the paper, black cuts through it. */}
            <rect x={0} y={0} width={WIDTH} height={PANEL_BOTTOM} fill="#fff" />
            <g fill="#000">
              <Lattice />
              {variant === 0 && (
                <>
                  <circle cx={50} cy={52} r={12} />
                  <circle cx={50} cy={52} r={20} fill="none" stroke="#000" strokeWidth={3} strokeDasharray="6 5" />
                </>
              )}
              {variant === 1 && (
                <>
                  <path d="M50 30 L66 52 L50 74 L34 52 Z" />
                  <path d="M50 39 L57 52 L50 65 L43 52 Z" fill="#fff" />
                  <circle cx={50} cy={52} r={3.5} />
                </>
              )}
              {/* One motif only. A bar beneath the star used to overlap the bottom row of
                  lattice holes and the two merged into an unreadable smudge. */}
              {variant === 2 && <path d="M50 31 l6 15 16 1 -12 10 4 16 -14 -9 -14 9 4 -16 -12 -10 16 -1 Z" />}
            </g>
            <Fringe />
          </mask>
        ))}
      </defs>
    </svg>
  );
}

interface PapelPicadoProps {
  className?: string;
  /** Degrees of tilt. Strings are never hung level, and two runs at opposing angles read as two. */
  tilt?: number;
  /** Shifts the colour and pattern cycle so a second run does not mirror the first. */
  offset?: number;
}

export function PapelPicado({ className, tilt = 0, offset = 0 }: PapelPicadoProps) {
  return (
    <div
      aria-hidden
      style={{ transform: `rotate(${tilt}deg)` }}
      // Breaks out of whatever centred, max-width column it was dropped into, but only up to a
      // point: edge to edge is right on a phone and looks odd stretched across a monitor, so the
      // run caps at 48rem and stays centred on the content. min() does this without a breakpoint
      // -- below a 640px viewport 120vw is the smaller value and the run is full bleed.
      //
      // The ends fade only in the band where they would otherwise show a cut flag: above
      // 640px the run is capped, and below 1280px there are no gutter cards yet. At xl the
      // cards cover both ends, which hides them better than any gradient.
      // 100vw counts the scrollbar, so body carries overflow-x: clip.
      className={`relative ml-[calc(50%-min(60vw,24rem))] flex h-24 w-[min(120vw,48rem)] justify-center overflow-hidden sm:h-28 sm:[mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] xl:[mask-image:none] ${className ?? ''}`}
    >
      <PicadoMasks />
      {Array.from({ length: FLAG_COUNT }, (_, index) => (
        <svg
          key={index}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="papel-picado-flag h-full w-auto shrink-0"
          // Staggered so the row ripples along rather than swinging as one slab.
          style={{ animationDelay: `${((index + offset) % 6) * -0.9}s` }}
          aria-hidden
          focusable="false"
        >
          {/* The panel's top edge follows the string's sag, so a row of flags reads as one
              hanging line rather than a flat band with a line drawn over it. */}
          <path d={PANEL_PATH} fill={COLORS[(index + offset) % COLORS.length]} mask={`url(#${MASK_IDS[(index + offset) % MASK_IDS.length]})`} />
          <path d={STRING_PATH} fill="none" stroke="var(--foreground)" strokeWidth={2} strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
