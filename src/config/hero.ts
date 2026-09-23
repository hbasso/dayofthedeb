import heroPhoto from '../../public/WaterColorCrop.webp';

/**
 * The home page banner. Imported rather than referenced by URL: the site gate would redirect
 * the image optimizer's own fetch of a /public file to /unlock, and an import serves it from
 * /_next/static, which the gate lets through. Swapping the painting means rewriting the alt
 * text below with it.
 */
export const heroImage = {
  src: heroPhoto,
  alt: 'A painting of the San Antonio River Walk at night: a stone footbridge banked with flowers, candle lanterns lining the water, café umbrellas on the far bank, and the Tower of the Americas lit above downtown',
};
