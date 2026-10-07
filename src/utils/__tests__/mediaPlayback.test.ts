import { describe, expect, it, jest } from '@jest/globals';

import {
  getNextAudioPlaybackRate,
  getRetryRestorePosition,
  getSupportedAudioPlaybackRate,
  runPlaybackCompletion,
  shouldRestorePlaybackPosition,
} from '../mediaPlayback';

describe('media playback helpers', () => {
  it('normalizes and cycles supported audio playback rates', () => {
    expect(getSupportedAudioPlaybackRate(1.249)).toBe(1.25);
    expect(getSupportedAudioPlaybackRate(Number.NaN)).toBe(1);
    expect(getNextAudioPlaybackRate(0.75)).toBe(1);
    expect(getNextAudioPlaybackRate(1.5)).toBe(0.75);
    expect(getNextAudioPlaybackRate(9)).toBe(1.25);
  });

  it('only restores a meaningful position near the beginning of unfinished media', () => {
    expect(shouldRestorePlaybackPosition(0, 30, 120)).toBe(true);
    expect(shouldRestorePlaybackPosition(2, 30, 120)).toBe(false);
    expect(shouldRestorePlaybackPosition(0, 1, 120)).toBe(false);
    expect(shouldRestorePlaybackPosition(0, 119, 120)).toBe(false);
    expect(shouldRestorePlaybackPosition(0, 30, 0)).toBe(true);
  });

  it('preserves current progress for retries without discarding an initial resume point', () => {
    expect(getRetryRestorePosition(45, 30)).toBe(45);
    expect(getRetryRestorePosition(0, 30)).toBe(30);
    expect(getRetryRestorePosition(Number.NaN, 30)).toBe(30);
  });

  it('releases playback before reporting completion', async () => {
    const callOrder: string[] = [];

    await runPlaybackCompletion(
      async () => {
        callOrder.push('release');
      },
      () => callOrder.push('complete'),
      jest.fn()
    );

    expect(callOrder).toEqual(['release', 'complete']);
  });

  it('reports cleanup and callback errors without skipping completion', async () => {
    const cleanupError = new Error('Cleanup failed');
    const callbackError = new Error('Callback failed');
    const reportError = jest.fn();
    const reportCompletion = jest.fn(() => {
      throw callbackError;
    });

    await runPlaybackCompletion(
      async () => {
        throw cleanupError;
      },
      reportCompletion,
      reportError
    );

    expect(reportCompletion).toHaveBeenCalledTimes(1);
    expect(reportError.mock.calls).toEqual([[cleanupError], [callbackError]]);
  });
});
