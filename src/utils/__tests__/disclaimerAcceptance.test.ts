import { describe, expect, it } from '@jest/globals';

import {
  createDisclaimerAcceptance,
  hasAcceptedDisclaimerVersion,
  isLegacyDisclaimerAcceptance,
  serializeDisclaimerAcceptance,
} from '../disclaimerAcceptance';

describe('disclaimer acceptance', () => {
  const acceptedAt = new Date('2026-07-19T12:00:00.000Z');

  it('recognizes a valid acceptance for the current version', () => {
    const serialized = serializeDisclaimerAcceptance(
      createDisclaimerAcceptance('2026-07-19', acceptedAt)
    );

    expect(hasAcceptedDisclaimerVersion(serialized, '2026-07-19')).toBe(true);
  });

  it('requires acceptance again when the disclaimer version changes', () => {
    const serialized = serializeDisclaimerAcceptance(
      createDisclaimerAcceptance('2026-07-19', acceptedAt)
    );

    expect(hasAcceptedDisclaimerVersion(serialized, '2027-01-01')).toBe(false);
  });

  it('recognizes the legacy boolean value for one-time migration', () => {
    expect(isLegacyDisclaimerAcceptance('true')).toBe(true);
    expect(hasAcceptedDisclaimerVersion('true', '2026-07-19')).toBe(true);
  });

  it.each([null, 'false', '{}', '{not-json'])('rejects invalid stored data: %p', (value) => {
    expect(hasAcceptedDisclaimerVersion(value, '2026-07-19')).toBe(false);
  });
});
