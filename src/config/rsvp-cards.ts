import alamo from '../../public/loteria_cards/alamo.webp';
import cocktail from '../../public/loteria_cards/cocktail.webp';
import llamas from '../../public/loteria_cards/llamas.webp';
import mariachis from '../../public/loteria_cards/mariachis.webp';
import pastry from '../../public/loteria_cards/pastry.webp';
import quesoDip from '../../public/loteria_cards/queso-dip.webp';
import taco from '../../public/loteria_cards/taco.webp';
import texasFlag from '../../public/loteria_cards/texas-flag.webp';

/**
 * Lotería cards decorating the RSVP page: down the gutters on a wide screen, and in a block
 * under the search form on everything narrower. The two sets never appear at once, so they are
 * free to share cards.
 *
 * Tilts are fixed per card rather than random: a value that changed between the server render
 * and the browser would hydrate as a mismatch, and decoration is not worth that.
 */
export const sideCards = {
  left: [
    { id: 'llamas', src: llamas, tilt: -5 },
    { id: 'pastry', src: pastry, tilt: 3.5 },
    { id: 'texas-flag', src: texasFlag, tilt: -3 },
    { id: 'cocktail', src: cocktail, tilt: 4.5 },
  ],
  right: [
    { id: 'mariachis', src: mariachis, tilt: 4 },
    { id: 'queso-dip', src: quesoDip, tilt: -4.5 },
    { id: 'taco', src: taco, tilt: 3 },
    { id: 'alamo', src: alamo, tilt: -3.5 },
  ],
};

/** Shown under the form below xl, where there are no gutters to fill. */
export const stackCards = [
  { id: 'llamas', src: llamas, tilt: -2.5 },
  { id: 'pastry', src: pastry, tilt: 2 },
  { id: 'queso-dip', src: quesoDip, tilt: 2.5 },
  { id: 'taco', src: taco, tilt: -2 },
];
