import type { LoteriaCardPalette } from '@/components/loteria/loteria-card';

export interface Honoree {
  /** Card number, 1 through 5. */
  number: number;
  /** Her name, once confirmed. Until then the card reads "La Debutante". */
  name: string | null;
  /** Her photo, once it exists. The host adds the file to /public and points here. */
  image: { src: string; alt: string } | null;
  /** Card-art colors, one fiesta hue each (these are artwork colors, not theme tokens). */
  palette: LoteriaCardPalette;
}

export const honorees: Honoree[] = [
  { number: 1, name: null, image: null, palette: { background: '#C2127A' } },
  { number: 2, name: null, image: null, palette: { background: '#D48000' } },
  { number: 3, name: null, image: null, palette: { background: '#008030' } },
  { number: 4, name: null, image: null, palette: { background: '#1565C0' } },
  { number: 5, name: null, image: null, palette: { background: '#00A6A6' } },
];
