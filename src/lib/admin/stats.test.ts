import { describe, expect, it } from 'vitest';
import { INVITATIONS, TODAY } from '@/lib/admin/fixtures';
import { computeStats } from '@/lib/admin/stats';

describe('computeStats', () => {
  const stats = computeStats(INVITATIONS, TODAY);

  it('counts people coming as attending guests plus named plus-ones', () => {
    expect(stats.attendingGuests).toBe(3); // Grant, Sue, Emma
    expect(stats.plusOnesComing).toBe(1); // Priya (Emma's blank name and Bill's declined plus-one don't count)
    expect(stats.headcount).toBe(4);
  });

  it('breaks guests down by response', () => {
    expect(stats).toMatchObject({ declinedGuests: 2, awaitingGuests: 3, guestsResponded: 5, totalGuests: 8 });
  });

  it('uses households as the response-rate denominator, never the headcount', () => {
    expect(stats.householdsResponded).toBe(3); // Biggs, Musgroves, Hunter
    expect(stats.totalHouseholds).toBe(4);
  });

  it('reports plus-ones offered versus coming', () => {
    expect(stats.plusOnesOffered).toBe(4); // Grant, Truman, Emma, Bill
  });

  it('counts households whose latest response is within the last 7 days, including today', () => {
    expect(stats.householdsRespondedLast7Days).toBe(2); // Biggs (09-12), Musgroves (09-14); Hunter (09-01) is older
    expect(stats.lastResponseDate).toBe('2026-09-14');
  });

  it('handles an empty list', () => {
    expect(computeStats([], TODAY)).toMatchObject({ headcount: 0, totalHouseholds: 0, lastResponseDate: null });
  });
});
