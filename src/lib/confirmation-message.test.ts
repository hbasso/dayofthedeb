import { describe, expect, it } from 'vitest';
import {
  CONFIRMATION_ALL_NO,
  CONFIRMATION_PENDING,
  CONFIRMATION_YES,
  confirmationMessage,
} from '@/lib/confirmation-message';

describe('confirmationMessage', () => {
  it('shows the party details when anyone is coming', () => {
    expect(confirmationMessage([{ attending: 'yes' }, { attending: 'no' }])).toBe(CONFIRMATION_YES);
    expect(confirmationMessage([{ attending: 'yes' }, { attending: null }])).toBe(CONFIRMATION_YES);
  });

  it('says we will miss you when every guest declined', () => {
    expect(confirmationMessage([{ attending: 'no' }, { attending: 'no' }])).toBe(CONFIRMATION_ALL_NO);
  });

  it('keeps a neutral line when no one said yes and someone is still unanswered', () => {
    expect(confirmationMessage([{ attending: 'no' }, { attending: null }])).toBe(CONFIRMATION_PENDING);
    expect(confirmationMessage([])).toBe(CONFIRMATION_PENDING);
  });

  it('never names the household and uses no dashes', () => {
    for (const line of [CONFIRMATION_YES, CONFIRMATION_ALL_NO, CONFIRMATION_PENDING]) {
      expect(line).not.toMatch(/[-–—]/);
    }
  });
});
