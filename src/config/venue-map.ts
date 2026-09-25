import venueMapImage from '../../public/VenueMap.webp';

/**
 * The illustrated map from the invitation. Imported rather than referenced by URL: the site gate
 * would redirect the image optimizer's own fetch of a /public file to /unlock.
 */
export const venueMap = {
  src: venueMapImage,
  alt: 'Illustrated map of downtown San Antonio. Parking Garage A sits on North Alamo near Alamo Plaza and Parking Garage B sits beside The Alamo on Crockett Street; a rideshare drop-off is marked at Fogo de Chão on East Commerce Street. Arrows from all three lead to a gold star at Mexico Ceaty, inside Rivercenter Mall on the river level.',
};
