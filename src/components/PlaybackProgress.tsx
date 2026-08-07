import { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { colors, theme } from '../theme';
import { formatPlaybackTime } from '../utils/time';

type PlaybackProgressProps = {
  accessibilityLabel?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void | Promise<void>;
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

export function getPlaybackSeekTime(locationX?: number, width?: number, duration?: number) {
  const safeWidth = sanitizePlaybackTime(width);

  if (safeWidth <= 0) {
    return 0;
  }

  return clampPlaybackProgress(sanitizePlaybackTime(locationX) / safeWidth) * sanitizePlaybackTime(duration);
}

export function PlaybackProgress({
  accessibilityLabel,
  currentTime,
  duration,
  onSeek,
  progress,
  tone = 'soft',
}: PlaybackProgressProps) {
  const trackWidth = useRef(0);
  const safeCurrentTime = sanitizePlaybackTime(currentTime);
  const safeDuration = sanitizePlaybackTime(duration);
  const clampedProgress = clampPlaybackProgress(progress);
  const accessibilityMax = safeDuration || 1;
  const accessibilityNow = safeDuration ? Math.min(safeCurrentTime, safeDuration) : 0;
  const isOverlay = tone === 'overlay';
  const isSeekEnabled = Boolean(onSeek) && safeDuration > 0;

  function requestSeek(time: number) {
    if (!onSeek || !isSeekEnabled) {
      return;
    }

    try {
      const result = onSeek(Math.min(sanitizePlaybackTime(time), safeDuration));
      if (result) {
        void result.catch((error) => console.warn('Unable to seek playback.', error));
      }
    } catch (error) {
      console.warn('Unable to seek playback.', error);
    }
  }

  function handleTrackLayout(event: LayoutChangeEvent) {
    trackWidth.current = event.nativeEvent.layout.width;
  }

  function handleTrackPress(event: GestureResponderEvent) {
    requestSeek(
      getPlaybackSeekTime(event.nativeEvent.locationX, trackWidth.current, safeDuration)
    );
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const seekStep = Math.max(5, safeDuration * 0.05);

    if (event.nativeEvent.actionName === 'increment') {
      requestSeek(safeCurrentTime + seekStep);
    } else if (event.nativeEvent.actionName === 'decrement') {
      requestSeek(safeCurrentTime - seekStep);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(safeCurrentTime)}
        </Text>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(safeDuration)}
        </Text>
      </View>
      <Pressable
        accessibilityActions={
          isSeekEnabled
            ? [
                { label: 'Seek forward', name: 'increment' },
                { label: 'Seek backward', name: 'decrement' },
              ]
            : undefined
        }
        accessibilityHint={isSeekEnabled ? 'Tap or adjust to seek through this session.' : undefined}
        accessibilityLabel={
          accessibilityLabel ??
          `Playback progress ${formatPlaybackTime(safeCurrentTime)} of ${formatPlaybackTime(safeDuration)}`
        }
        accessibilityRole={isSeekEnabled ? 'adjustable' : 'progressbar'}
        accessibilityState={{ disabled: !isSeekEnabled }}
        accessibilityValue={{
          max: accessibilityMax,
          min: 0,
          now: accessibilityNow,
          text: `${formatPlaybackTime(safeCurrentTime)} of ${formatPlaybackTime(safeDuration)}`,
        }}
        disabled={!isSeekEnabled}
        hitSlop={{ bottom: 10, top: 10 }}
        onAccessibilityAction={handleAccessibilityAction}
        onLayout={handleTrackLayout}
        onPress={handleTrackPress}
        style={[styles.track, isOverlay && styles.overlayTrack]}
      >
        <View
          style={[
            styles.fill,
            isOverlay && styles.overlayFill,
            { width: `${clampedProgress * 100}%` },
          ]}
        />
      </Pressable>
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
    backgroundColor: colors.leafDeep,
    borderRadius: theme.radius.full,
    height: '100%',
  },
  overlayFill: {
    backgroundColor: colors.offWhite,
  },
});
