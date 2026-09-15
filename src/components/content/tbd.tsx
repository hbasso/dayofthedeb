/** Renders a confirmed fact, or a clearly marked placeholder until the host confirms it. */
export function Tbd({ value, placeholder = 'To be announced' }: { value: string | null | undefined; placeholder?: string }) {
  if (value) return <>{value}</>;
  return <span className="text-muted-foreground italic">{placeholder}</span>;
}
