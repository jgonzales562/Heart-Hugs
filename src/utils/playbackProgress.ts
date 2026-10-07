export function sanitizePlaybackTime(value?: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function clampPlaybackProgress(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(value, 1));
}

export function getPlaybackProgress(currentTime?: number, duration?: number): number {
  const safeDuration = sanitizePlaybackTime(duration);

  if (safeDuration <= 0) {
    return 0;
  }

  return clampPlaybackProgress(sanitizePlaybackTime(currentTime) / safeDuration);
}

export function getPlaybackSeekTime(
  locationX?: number,
  width?: number,
  duration?: number
): number {
  const safeWidth = sanitizePlaybackTime(width);

  if (safeWidth <= 0) {
    return 0;
  }

  const trackProgress = clampPlaybackProgress(sanitizePlaybackTime(locationX) / safeWidth);

  return trackProgress * sanitizePlaybackTime(duration);
}
