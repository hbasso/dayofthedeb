/** Anything with an intrinsic size, such as a statically imported image. */
export interface Sized {
  width: number;
  height: number;
}

/**
 * Deals items into columns the way a masonry board does: each item goes to whichever column is
 * currently shortest, ties going to the leftmost. Heights are compared at equal column width, so
 * only each item's aspect ratio matters.
 *
 * The point of doing this in code rather than with CSS columns is reading order. CSS columns fill
 * the first column top to bottom before starting the next, so the head of the second column is
 * whatever photo happens to sit halfway down the list. Here the first `columnCount` items always
 * form the top row, and the list order is the order a guest sees, left to right and top down.
 */
export function masonryColumns<T extends Sized>(items: readonly T[], columnCount: number): T[][] {
  if (!Number.isInteger(columnCount) || columnCount < 1) {
    throw new RangeError(`columnCount must be a positive integer, got ${columnCount}`);
  }
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  const heights: number[] = new Array<number>(columnCount).fill(0);
  for (const item of items) {
    let shortest = 0;
    for (let c = 1; c < columnCount; c++) {
      if (heights[c] < heights[shortest]) shortest = c;
    }
    columns[shortest].push(item);
    heights[shortest] += item.height / item.width;
  }
  return columns;
}
