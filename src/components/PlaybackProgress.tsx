import { StyleSheet, Text, View } from 'react-native';

import { colors, theme } from '../theme';
import { formatPlaybackTime } from '../utils/time';

type PlaybackProgressProps = {
  accessibilityLabel?: string;
  currentTime?: number;
  duration?: number;
  progress?: number;
  tone?: 'soft' | 'overlay';
};

export function sanitizePlaybackTime(value?: number) {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

export function clampPlaybackProgress(value?: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(value ?? 0, 1));
}

export function getPlaybackProgress(currentTime?: number, duration?: number) {
  const safeDuration = sanitizePlaybackTime(duration);

  if (safeDuration <= 0) {
    return 0;
  }

  return clampPlaybackProgress(sanitizePlaybackTime(currentTime) / safeDuration);
}

export function PlaybackProgress({
  accessibilityLabel,
  currentTime,
  duration,
  progress,
  tone = 'soft',
}: PlaybackProgressProps) {
  const safeCurrentTime = sanitizePlaybackTime(currentTime);
  const safeDuration = sanitizePlaybackTime(duration);
  const clampedProgress = clampPlaybackProgress(progress);
  const accessibilityMax = safeDuration || 1;
  const accessibilityNow = safeDuration ? Math.min(safeCurrentTime, safeDuration) : 0;
  const isOverlay = tone === 'overlay';

  return (
    <View
      accessibilityLabel={
        accessibilityLabel ??
        `Playback progress ${formatPlaybackTime(safeCurrentTime)} of ${formatPlaybackTime(safeDuration)}`
      }
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: accessibilityMax,
        min: 0,
        now: accessibilityNow,
        text: `${formatPlaybackTime(safeCurrentTime)} of ${formatPlaybackTime(safeDuration)}`,
      }}
      style={styles.container}
    >
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(safeCurrentTime)}
        </Text>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(safeDuration)}
        </Text>
      </View>
      <View style={[styles.track, isOverlay && styles.overlayTrack]}>
        <View
          style={[
            styles.fill,
            isOverlay && styles.overlayFill,
            { width: `${clampedProgress * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
    width: '100%',
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.slate,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    minWidth: 42,
  },
  overlayTimeText: {
    color: colors.offWhite,
  },
  track: {
    backgroundColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    height: 7,
    overflow: 'hidden',
    width: '100%',
  },
  overlayTrack: {
    backgroundColor: 'rgba(255, 249, 240, 0.34)',
    height: 5,
  },
  fill: {
    backgroundColor: colors.tealDeep,
    borderRadius: theme.radius.full,
    height: '100%',
  },
  overlayFill: {
    backgroundColor: colors.offWhite,
  },
});
