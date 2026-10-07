export function formatPlaybackTime(value?: number): string {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = Math.floor(safeValue % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
