import { describe, expect, it } from '@jest/globals';

import {
  clampPlaybackProgress,
  getPlaybackProgress,
  getPlaybackSeekTime,
  sanitizePlaybackTime,
} from '../playbackProgress';
import { formatPlaybackTime } from '../time';

describe('playback helpers', () => {
  it('sanitizes invalid time values', () => {
    expect(sanitizePlaybackTime()).toBe(0);
    expect(sanitizePlaybackTime(Number.NaN)).toBe(0);
    expect(sanitizePlaybackTime(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(sanitizePlaybackTime(Number.POSITIVE_INFINITY)).toBe(0);
    expect(sanitizePlaybackTime(-10)).toBe(0);
    expect(sanitizePlaybackTime(10.5)).toBe(10.5);
  });

  it('clamps progress to the available range', () => {
    expect(clampPlaybackProgress(-1)).toBe(0);
    expect(clampPlaybackProgress(1.5)).toBe(1);
    expect(clampPlaybackProgress()).toBe(0);
    expect(clampPlaybackProgress(Number.POSITIVE_INFINITY)).toBe(0);
    expect(getPlaybackProgress(30, 120)).toBe(0.25);
    expect(getPlaybackProgress(150, 120)).toBe(1);
    expect(getPlaybackProgress(Number.POSITIVE_INFINITY, 120)).toBe(0);
    expect(getPlaybackProgress(30, 0)).toBe(0);
    expect(getPlaybackProgress(30, Number.NaN)).toBe(0);
  });

  it.each([
    [undefined, '0:00'],
    [Number.NaN, '0:00'],
    [Number.NEGATIVE_INFINITY, '0:00'],
    [Number.POSITIVE_INFINITY, '0:00'],
    [-10, '0:00'],
    [0, '0:00'],
    [59.9, '0:59'],
    [60, '1:00'],
    [65.9, '1:05'],
  ])('formats playback time %p as %s', (value, expected) => {
    expect(formatPlaybackTime(value)).toBe(expected);
  });

  it('maps seek positions to a clamped playback time', () => {
    expect(getPlaybackSeekTime(50, 200, 120)).toBe(30);
    expect(getPlaybackSeekTime(250, 200, 120)).toBe(120);
    expect(getPlaybackSeekTime(-10, 200, 120)).toBe(0);
    expect(getPlaybackSeekTime(10, 0, 120)).toBe(0);
    expect(getPlaybackSeekTime(10, Number.POSITIVE_INFINITY, 120)).toBe(0);
    expect(getPlaybackSeekTime(10, 200, Number.NaN)).toBe(0);
  });
});
