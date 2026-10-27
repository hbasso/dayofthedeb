import ainslieBashara from '../../public/acb-deb.webp';
import anabelleBasso from '../../public/ajb-deb.webp';
import dressCard from '../../public/dress-card.webp';
import emmaCantwell from '../../public/egc-deb.webp';
import eloiseFlannery from '../../public/erf-deb.webp';
import helenaHanor from '../../public/hmh-deb.webp';

/**
 * The finished lotería-style cards shown on the hero. Imported rather than referenced by
 * URL: the site gate would redirect the image optimizer's own fetch of /public files to
 * /unlock, and an import serves them from /_next/static, which the gate lets through.
 *
 * Each file is named for the initials printed on that débutante's monogram, so a portrait here
 * and her boot card in public/loteria_cards share one key and cannot drift apart. The alt text
 * repeats the name exactly as it is painted on the card.
 */
// Ordered alphabetically by surname: Bashara, Basso, Cantwell, Flannery, Hanor. The dress card
// is not a débutante and stays last.
export const debCards = [
  { id: 'ainslie-bashara', src: ainslieBashara, alt: 'Lotería-style card for Ainslie Bashara' },
  { id: 'anabelle-basso', src: anabelleBasso, alt: 'Lotería-style card for Anabelle Basso' },
  { id: 'emma-cantwell', src: emmaCantwell, alt: 'Lotería-style card for Emma Cantwell' },
  { id: 'eloise-flannery', src: eloiseFlannery, alt: 'Lotería-style card for Eloise Flannery' },
  { id: 'helena-hanor', src: helenaHanor, alt: 'Lotería-style card for Helena Hanor' },
  { id: 'dress', src: dressCard, alt: 'Lotería-style card of a débutante gown, titled Debutante' },
];
