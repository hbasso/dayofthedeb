import heroPhoto from '../../public/water-color-crop.webp';

/**
 * The home page banner. Imported rather than referenced by URL: the site gate would redirect
 * the image optimizer's own fetch of a /public file to /unlock, and an import serves it from
 * /_next/static, which the gate lets through. Swapping the painting means rewriting the alt
 * text below with it.
 */
export const heroImage = {
  src: heroPhoto,
  /**
   * sizes and quality live here, not at the call site, because /unlock preloads this image
   * while the guest types their password. A preload only helps if it names the identical URL
   * the home page will go on to request, and two copies of these numbers would drift.
   */
  sizes: '100vw',
  /**
   * Lower than the default 75: this is the LCP image and it renders under a 45% black scrim,
   * which hides compression artefacts that would show on an unobscured photo. Next only honours
   * values listed in images.qualities in next.config.ts.
   */
  quality: 65,
  alt: 'A painting of the San Antonio River Walk at night: a stone footbridge banked with flowers, candle lanterns lining the water, café umbrellas on the far bank, and the Tower of the Americas lit above downtown',
};
