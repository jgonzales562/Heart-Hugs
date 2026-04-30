import { StyleSheet, Text, View } from 'react-native';

import { colors, theme } from '../theme';
import { formatPlaybackTime } from '../utils/time';

type PlaybackProgressProps = {
  currentTime: number;
  duration: number;
  progress: number;
  tone?: 'soft' | 'overlay';
};

export function PlaybackProgress({
  currentTime,
  duration,
  progress,
  tone = 'soft',
}: PlaybackProgressProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const isOverlay = tone === 'overlay';

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(currentTime)}
        </Text>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(duration)}
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
