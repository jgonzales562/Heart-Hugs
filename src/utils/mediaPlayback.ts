import { sanitizePlaybackTime } from './playbackProgress';

export const AUDIO_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

export type AudioPlaybackRate = (typeof AUDIO_PLAYBACK_RATES)[number];

export function getSupportedAudioPlaybackRate(playbackRate: number): AudioPlaybackRate {
  return AUDIO_PLAYBACK_RATES.find((rate) => Math.abs(rate - playbackRate) < 0.01) ?? 1;
}

export function getNextAudioPlaybackRate(playbackRate: number): AudioPlaybackRate {
  const supportedRate = getSupportedAudioPlaybackRate(playbackRate);
  const currentIndex = AUDIO_PLAYBACK_RATES.indexOf(supportedRate);

  return AUDIO_PLAYBACK_RATES[(currentIndex + 1) % AUDIO_PLAYBACK_RATES.length] ?? 1;
}

export function shouldRestorePlaybackPosition(
  currentTime: number,
  restorePosition: number,
  duration: number
): boolean {
  const safeCurrentTime = sanitizePlaybackTime(currentTime);
  const safeRestorePosition = sanitizePlaybackTime(restorePosition);
  const safeDuration = sanitizePlaybackTime(duration);

  return (
    safeCurrentTime <= 1 &&
    safeRestorePosition > 1 &&
    (safeDuration === 0 || safeRestorePosition < safeDuration - 2)
  );
}

export function getRetryRestorePosition(
  currentTime: number,
  previousRestorePosition: number
): number {
  const safeCurrentTime = sanitizePlaybackTime(currentTime);

  return safeCurrentTime > 1
    ? safeCurrentTime
    : sanitizePlaybackTime(previousRestorePosition);
}

export async function runPlaybackCompletion(
  releasePlayback: () => Promise<void>,
  reportCompletion: () => void,
  reportError: (error: unknown) => void
): Promise<void> {
  try {
    await releasePlayback();
  } catch (error) {
    reportError(error);
  }

  try {
    reportCompletion();
  } catch (error) {
    reportError(error);
  }
}
