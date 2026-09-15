import { describe, expect, it } from 'vitest';
import { MAX_ANSWERS, parseSubmitRsvpInput } from '@/lib/rsvp-input';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const valid = {
  invitationId: id('Biggs'),
  answers: [
    { guestId: id('Grant'), attending: 'yes', plusOneName: 'Priya Raman' },
    { guestId: id('Mario'), attending: 'no' },
  ],
};

describe('parseSubmitRsvpInput', () => {
  it('accepts a well-formed submission', () => {
    expect(parseSubmitRsvpInput(valid)).toEqual(valid);
  });

  it('omits email when absent', () => {
    expect(parseSubmitRsvpInput(valid)).not.toHaveProperty('email');
  });

  it('omits email when an empty string', () => {
    const parsed = parseSubmitRsvpInput({ ...valid, email: '' });
    expect(parsed).not.toHaveProperty('email');
  });

  it('includes a normalized email when valid', () => {
    const parsed = parseSubmitRsvpInput({ ...valid, email: ' Hudson.Basso@Example.COM ' });
    expect(parsed).toEqual({ ...valid, email: 'hudson.basso@example.com' });
  });

  it('rejects a submission with a malformed email', () => {
    expect(parseSubmitRsvpInput({ ...valid, email: 'not-an-email' })).toBeNull();
  });

  it('rejects a submission with a non-string email', () => {
    expect(parseSubmitRsvpInput({ ...valid, email: 42 })).toBeNull();
  });

  it('rejects a submission with an overlong email', () => {
    expect(parseSubmitRsvpInput({ ...valid, email: `${'a'.repeat(300)}@example.com` })).toBeNull();
  });

  it('drops unexpected extra properties', () => {
    const parsed = parseSubmitRsvpInput({
      ...valid,
      extra: true,
      answers: [{ guestId: id('Mario'), attending: 'no', note: 'hi' }],
    });
    expect(parsed).toEqual({ invitationId: id('Biggs'), answers: [{ guestId: id('Mario'), attending: 'no' }] });
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an array', [valid]],
    ['a missing invitation id', { answers: valid.answers }],
    ['a malformed invitation id', { ...valid, invitationId: 'recShort' }],
    ['answers that are not an array', { ...valid, answers: 'yes' }],
    ['no answers', { ...valid, answers: [] }],
    ['too many answers', { ...valid, answers: Array.from({ length: MAX_ANSWERS + 1 }, () => valid.answers[1]) }],
    ['a null answer', { ...valid, answers: [null] }],
    ['a malformed guest id', { ...valid, answers: [{ guestId: 42, attending: 'yes' }] }],
    ['an invalid attendance', { ...valid, answers: [{ guestId: id('Grant'), attending: 'maybe' }] }],
    ['a non-string plus-one name', { ...valid, answers: [{ guestId: id('Grant'), attending: 'yes', plusOneName: 7 }] }],
    ['an overlong plus-one name', { ...valid, answers: [{ guestId: id('Grant'), attending: 'yes', plusOneName: 'x'.repeat(101) }] }],
  ])('rejects %s', (_label, input) => {
    expect(parseSubmitRsvpInput(input)).toBeNull();
  });
});
