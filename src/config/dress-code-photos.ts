import photo1 from '../../public/pinterest/pinterest-1.webp';
import photo2 from '../../public/pinterest/pinterest-2.webp';
import photo3 from '../../public/pinterest/pinterest-3.webp';
import photo4 from '../../public/pinterest/pinterest-4.webp';
import photo5 from '../../public/pinterest/pinterest-5.webp';
import photo6 from '../../public/pinterest/pinterest-6.webp';
import photo7 from '../../public/pinterest/pinterest-7.webp';
import photo8 from '../../public/pinterest/pinterest-8.webp';
import photo9 from '../../public/pinterest/pinterest-9.webp';
import photo10 from '../../public/pinterest/pinterest-10.webp';
import photo11 from '../../public/pinterest/pinterest-11.webp';
import photo12 from '../../public/pinterest/pinterest-12.webp';
import photo13 from '../../public/pinterest/pinterest-13.webp';
import photo14 from '../../public/pinterest/pinterest-14.webp';
import photo15 from '../../public/pinterest/pinterest-15.webp';
import photo16 from '../../public/pinterest/pinterest-16.webp';
import photo17 from '../../public/pinterest/pinterest-17.webp';
import photo18 from '../../public/pinterest/pinterest-18.webp';
import photo19 from '../../public/pinterest/pinterest-19.webp';
import photo20 from '../../public/pinterest/pinterest-20.webp';
import photo21 from '../../public/pinterest/pinterest-21.webp';
import photo22 from '../../public/pinterest/pinterest-22.webp';
import photo23 from '../../public/pinterest/pinterest-23.webp';
import photo24 from '../../public/pinterest/pinterest-24.webp';
import photo25 from '../../public/pinterest/pinterest-25.webp';
import photo26 from '../../public/pinterest/pinterest-26.webp';
import photo28 from '../../public/pinterest/pinterest-28.webp';
import photo29 from '../../public/pinterest/pinterest-29.webp';
import photo30 from '../../public/pinterest/pinterest-30.webp';
import photo31 from '../../public/pinterest/pinterest-31.webp';
import photo32 from '../../public/pinterest/pinterest-32.webp';
import photo33 from '../../public/pinterest/pinterest-33.webp';
import photo34 from '../../public/pinterest/pinterest-34.webp';
import photo35 from '../../public/pinterest/pinterest-35.webp';
import photo36 from '../../public/pinterest/pinterest-36.webp';
import photo37 from '../../public/pinterest/pinterest-37.webp';
import photo38 from '../../public/pinterest/pinterest-38.webp';
import photo39 from '../../public/pinterest/pinterest-39.webp';
import photo40 from '../../public/pinterest/pinterest-40.webp';

/**
 * The hosts' inspiration board for the dress code.
 *
 * Statically imported, which buys three things at once: the site gate cannot redirect the image
 * optimizer's own fetch of a /public file, Next knows each image's intrinsic size so the masonry
 * never shifts as photos arrive, and every entry gets a real blurred preview generated from the
 * photo itself rather than a grey box.
 *
 * The photos are decorative in the accessibility sense: they are one illustration of a look, not
 * 39 separate facts, and the page states the dress code in words for anyone who cannot see them.
 * Give an individual photo its own alt text only if it ever carries information the copy does not.
 *
 * Order matters: it is the order a guest reads the board, left to right from the top row down (see
 * masonryColumns). The hosts asked for photos of people first, so complete looks worn by people
 * lead, men and women mixed and the group shots on top, then outfits shown without a face, then
 * the details and decor.
 */
export const dressCodePhotos = [
  // People in complete looks
  photo39,
  photo40,
  photo38,
  photo37,
  photo34,
  photo36,
  photo24,
  photo35,
  photo31,
  photo20,
  photo32,
  photo26,
  photo33,
  // Outfits without a face, and partial looks
  photo30,
  photo4,
  photo21,
  photo18,
  photo3,
  photo9,
  photo6,
  photo5,
  // Details, accessories and decor
  photo1,
  photo2,
  photo7,
  photo8,
  photo10,
  photo11,
  photo12,
  photo13,
  photo14,
  photo15,
  photo16,
  photo17,
  photo19,
  photo22,
  photo23,
  photo25,
  photo28,
  photo29,
];
