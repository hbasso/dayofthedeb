/** Renders a confirmed fact, or a clearly marked placeholder until the host confirms it. */
export function Tbd({ value, placeholder = 'To be announced' }: { value: string | null | undefined; placeholder?: string }) {
  if (value) return <>{value}</>;
  // Dimmed by opacity rather than a fixed muted colour, so the placeholder stays legible on a
  // filled card as well as on the cream page. 90% clears AA both ways: 9.9:1 on cream, 4.9:1 on
  // the fiesta pink of the home-page detail cards.
  return <span className="italic opacity-90">{placeholder}</span>;
}
