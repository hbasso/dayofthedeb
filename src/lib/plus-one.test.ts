import { describe, expect, it } from 'vitest';
import { storedPlusOneName } from '@/lib/plus-one';

describe('storedPlusOneName', () => {
  it('keeps a trimmed name for an eligible guest who is attending', () => {
    expect(storedPlusOneName(true, 'yes', '  Priya Raman ')).toBe('Priya Raman');
  });

  it('clears the name when the guest is not attending', () => {
    expect(storedPlusOneName(true, 'no', 'Priya Raman')).toBeNull();
  });

  it('clears a blank or missing name', () => {
    expect(storedPlusOneName(true, 'yes', '   ')).toBeNull();
    expect(storedPlusOneName(true, 'yes', undefined)).toBeNull();
  });

  it('never keeps a name for a guest without plus-one eligibility', () => {
    expect(storedPlusOneName(false, 'yes', 'Sneaky Guest')).toBeNull();
  });
});
