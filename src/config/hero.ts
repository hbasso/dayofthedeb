import heroPhoto from '../../public/WaterColorCrop.webp';

/**
 * The home page banner. Imported rather than referenced by URL: the site gate would
 * redirect the image optimizer's own fetch of /RiverwalkBoat.webp to /unlock, and an
 * import serves the file from /_next/static, which the gate lets through.
 */
export const heroImage = {
  src: heroPhoto,
  alt: 'The Mexico Ceaty sign at the Shops at Rivercenter, above a barge passing on the San Antonio River Walk',
};
