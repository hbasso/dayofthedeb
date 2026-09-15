import ainslieBashara from '../../public/AB2Deb.png';
import annabelleBasso from '../../public/ABDeb.png';
import dressCard from '../../public/DressCard.png';
import emmaCantwell from '../../public/ECDeb.png';
import eloiseFlannery from '../../public/EFDeb.png';
import helenaHanor from '../../public/HHDeb.png';

/**
 * The finished lotería-style cards shown on the hero. Imported rather than referenced by
 * URL: the site gate would redirect the image optimizer's own fetch of /public files to
 * /unlock, and an import serves them from /_next/static, which the gate lets through.
 */
export const debCards = [
  { id: 'annabelle-basso', src: annabelleBasso, alt: 'Lotería-style card for Annabelle Basso' },
  { id: 'ainslie-bashara', src: ainslieBashara, alt: 'Lotería-style card for Ainslie Bashara' },
  { id: 'emma-cantwell', src: emmaCantwell, alt: 'Lotería-style card for Emma Cantwell' },
  { id: 'eloise-flannery', src: eloiseFlannery, alt: 'Lotería-style card for Eloise Flannery' },
  { id: 'helena-hanor', src: helenaHanor, alt: 'Lotería-style card for Helena Hanor' },
  { id: 'dress', src: dressCard, alt: 'Lotería-style card of a débutante gown, titled Debutante' },
];
