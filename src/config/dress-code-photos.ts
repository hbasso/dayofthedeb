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
import photo27 from '../../public/pinterest/pinterest-27.webp';
import photo28 from '../../public/pinterest/pinterest-28.webp';
import photo29 from '../../public/pinterest/pinterest-29.webp';

/**
 * The hosts' inspiration board for the dress code.
 *
 * Statically imported, which buys three things at once: the site gate cannot redirect the image
 * optimizer's own fetch of a /public file, Next knows each image's intrinsic size so the masonry
 * never shifts as photos arrive, and every entry gets a real blurred preview generated from the
 * photo itself rather than a grey box.
 *
 * The photos are decorative in the accessibility sense: they are one illustration of a look, not
 * 29 separate facts, and the page states the dress code in words for anyone who cannot see them.
 * Give an individual photo its own alt text only if it ever carries information the copy does not.
 */
export const dressCodePhotos = [
  photo1,
  photo2,
  photo3,
  photo4,
  photo5,
  photo6,
  photo7,
  photo8,
  photo9,
  photo10,
  photo11,
  photo12,
  photo13,
  photo14,
  photo15,
  photo16,
  photo17,
  photo18,
  photo19,
  photo20,
  photo21,
  photo22,
  photo23,
  photo24,
  photo25,
  photo26,
  photo27,
  photo28,
  photo29,
];
