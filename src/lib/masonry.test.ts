import { describe, expect, it } from 'vitest';
import { masonryColumns } from './masonry';

const photo = (id: string, width: number, height: number) => ({ id, width, height });
const ids = (columns: { id: string }[][]) => columns.map((column) => column.map((p) => p.id));

describe('masonryColumns', () => {
  it('puts the first items across the top row, left to right', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((id) => photo(id, 100, 150));
    const columns = masonryColumns(items, 4);
    expect(columns.map((column) => column[0].id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sends each later item to the shortest column', () => {
    const items = [
      photo('tall', 100, 300),
      photo('short', 100, 100),
      photo('next', 100, 100),
      photo('after', 100, 100),
    ];
    // After the top row the right column is shorter, so it takes the next two.
    expect(ids(masonryColumns(items, 2))).toEqual([['tall'], ['short', 'next', 'after']]);
  });

  it('compares aspect ratios, not pixel sizes', () => {
    const items = [photo('big', 2000, 3000), photo('small', 100, 200), photo('third', 10, 10)];
    // 1.5 tall against 2 tall: the larger file is the shorter column.
    expect(ids(masonryColumns(items, 2))).toEqual([['big', 'third'], ['small']]);
  });

  it('breaks ties to the left', () => {
    const items = [photo('a', 1, 1), photo('b', 1, 1), photo('c', 1, 1)];
    expect(ids(masonryColumns(items, 2))).toEqual([['a', 'c'], ['b']]);
  });

  it('keeps every item exactly once', () => {
    const items = Array.from({ length: 39 }, (_, i) => photo(String(i), 100 + i, 100 + ((i * 37) % 90)));
    const flat = masonryColumns(items, 3).flat();
    expect(flat).toHaveLength(39);
    expect(new Set(flat.map((p) => p.id)).size).toBe(39);
  });

  it('returns empty columns for no items', () => {
    expect(masonryColumns([], 3)).toEqual([[], [], []]);
  });

  it('rejects a column count that is not a positive integer', () => {
    expect(() => masonryColumns([], 0)).toThrow(RangeError);
    expect(() => masonryColumns([], 1.5)).toThrow(RangeError);
  });
});
