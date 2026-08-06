import { describe, expect, it } from '@jest/globals';

import {
  clampPlaybackProgress,
  getPlaybackProgress,
  getPlaybackSeekTime,
  sanitizePlaybackTime,
} from '../../components/PlaybackProgress';
import { formatPlaybackTime } from '../time';

describe('playback helpers', () => {
  it('sanitizes invalid time values', () => {
    expect(sanitizePlaybackTime(Number.NaN)).toBe(0);
    expect(sanitizePlaybackTime(-10)).toBe(0);
    expect(formatPlaybackTime(Number.POSITIVE_INFINITY)).toBe('0:00');
  });

  it('clamps progress to the available range', () => {
    expect(clampPlaybackProgress(-1)).toBe(0);
    expect(clampPlaybackProgress(1.5)).toBe(1);
    expect(getPlaybackProgress(30, 120)).toBe(0.25);
    expect(getPlaybackProgress(30, 0)).toBe(0);
  });

  it('formats durations consistently', () => {
    expect(formatPlaybackTime(0)).toBe('0:00');
    expect(formatPlaybackTime(65.9)).toBe('1:05');
  });

  it('maps seek positions to a clamped playback time', () => {
    expect(getPlaybackSeekTime(50, 200, 120)).toBe(30);
    expect(getPlaybackSeekTime(250, 200, 120)).toBe(120);
    expect(getPlaybackSeekTime(-10, 200, 120)).toBe(0);
    expect(getPlaybackSeekTime(10, 0, 120)).toBe(0);
  });
});
