import alamo from '../../public/loteria_cards/alamo.webp';
import cocktail from '../../public/loteria_cards/cocktail.webp';
import cowboyHat from '../../public/loteria_cards/cowboy-hat.webp';
import discoBall from '../../public/loteria_cards/disco-ball.webp';
import riverBoat from '../../public/loteria_cards/river-boat.webp';
import taco from '../../public/loteria_cards/taco.webp';

/**
 * The lotería cards along the foot of the home page. Six of the eleven non-portrait cards, and
 * six is also how many débutante cards sit up in the hero, so the two rows answer each other.
 * Still unused in public/loteria_cards: llamas, mariachis, pastry, queso-dip, texas-flag.
 *
 * Statically imported like every other local image, so the gate cannot redirect the optimizer's
 * own fetch and each card arrives with its own blurred preview.
 */
export const loteriaCards = [
  { id: 'alamo', src: alamo, alt: 'Lotería-style card of the Alamo' },
  { id: 'river-boat', src: riverBoat, alt: 'Lotería-style card of a River Walk barge' },
  { id: 'cowboy-hat', src: cowboyHat, alt: 'Lotería-style card of a cowboy hat' },
  { id: 'taco', src: taco, alt: 'Lotería-style card of a taco' },
  { id: 'cocktail', src: cocktail, alt: 'Lotería-style card of a cocktail' },
  { id: 'disco-ball', src: discoBall, alt: 'Lotería-style card of a disco ball' },
];
