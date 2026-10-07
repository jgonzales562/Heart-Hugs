import { describe, expect, it } from '@jest/globals';

import {
  clampMoodValue,
  createMoodLogGuard,
  formatCheckInDateTime,
  getMoodBand,
  getMoodDescriptor,
  getMoodValueFromPosition,
  normalizeMoodScore,
} from '../mood';

describe('mood helpers', () => {
  it.each([
    [-10, 0],
    [0, 0],
    [47.5, 47.5],
    [100, 100],
    [120, 100],
    [Number.NaN, 50],
    [Number.NEGATIVE_INFINITY, 50],
    [Number.POSITIVE_INFINITY, 50],
  ])('clamps mood value %p to %p', (value, expected) => {
    expect(clampMoodValue(value)).toBe(expected);
  });

  it.each([
    [0, 'Running on empty'],
    [20, 'Running on empty'],
    [21, 'Feeling low'],
    [40, 'Feeling low'],
    [41, 'In between'],
    [60, 'In between'],
    [61, 'Feeling good'],
    [80, 'Feeling good'],
    [81, 'Feeling bright'],
    [100, 'Feeling bright'],
    [Number.NaN, 'In between'],
  ])('describes mood value %p as %s', (value, expected) => {
    expect(getMoodDescriptor(value).label).toBe(expected);
  });

  it.each([
    [-1, 0, 'very-low'],
    [20.4, 20, 'very-low'],
    [20.5, 21, 'low'],
    [40.4, 40, 'low'],
    [40.5, 41, 'middle'],
    [60.4, 60, 'middle'],
    [60.5, 61, 'good'],
    [80.4, 80, 'good'],
    [80.5, 81, 'bright'],
    [101, 100, 'bright'],
    [Number.NaN, 50, 'middle'],
  ])('normalizes score %p to %p in the %s band', (value, score, band) => {
    expect(normalizeMoodScore(value)).toBe(score);
    expect(getMoodBand(value)).toBe(band);
  });

  it('maps track positions to clamped mood values', () => {
    expect(getMoodValueFromPosition(20, 20, 200)).toBe(0);
    expect(getMoodValueFromPosition(120, 20, 200)).toBe(50);
    expect(getMoodValueFromPosition(220, 20, 200)).toBe(100);
    expect(getMoodValueFromPosition(-80, 20, 200)).toBe(0);
    expect(getMoodValueFromPosition(320, 20, 200)).toBe(100);
    expect(getMoodValueFromPosition(120, 20, 0)).toBe(50);
    expect(getMoodValueFromPosition(Number.NaN, 20, 200)).toBe(50);
  });

  it('prevents duplicate mood logging until the guard is released', () => {
    const guard = createMoodLogGuard();

    expect(guard.tryAcquire()).toBe(true);
    expect(guard.tryAcquire()).toBe(false);
    guard.release();
    expect(guard.tryAcquire()).toBe(true);
  });

  it('formats check-in dates relative to a supplied date', () => {
    const referenceDate = new Date(2026, 7, 28, 12);

    expect(formatCheckInDateTime(new Date(2026, 7, 28, 10).toISOString(), referenceDate)).toMatch(
      /^Today · /
    );
    expect(formatCheckInDateTime(new Date(2026, 7, 27, 10).toISOString(), referenceDate)).toMatch(
      /^Yesterday · /
    );
    expect(formatCheckInDateTime(new Date(2025, 7, 28, 10).toISOString(), referenceDate)).toContain(
      '2025'
    );
    expect(formatCheckInDateTime('not-a-date', referenceDate)).toBe('Recently');
  });
});
