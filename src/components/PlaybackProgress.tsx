import { useRef, type ReactElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { BreathingPressable } from './BreathingPressable';
import { colors, theme } from '../theme';
import {
  getPlaybackProgress,
  getPlaybackSeekTime,
  sanitizePlaybackTime,
} from '../utils/playbackProgress';
import { formatPlaybackTime } from '../utils/time';

type PlaybackProgressProps = {
  readonly accessibilityLabel?: string;
  readonly currentTime?: number;
  readonly duration?: number;
  readonly onSeek?: (time: number) => void | Promise<void>;
  readonly tone?: 'soft' | 'overlay';
};

export function PlaybackProgress({
  accessibilityLabel,
  currentTime,
  duration,
  onSeek,
  tone = 'soft',
}: PlaybackProgressProps): ReactElement {
  const trackWidth = useRef(0);
  const safeCurrentTime = sanitizePlaybackTime(currentTime);
  const safeDuration = sanitizePlaybackTime(duration);
  const displayedCurrentTime = safeDuration
    ? Math.min(safeCurrentTime, safeDuration)
    : safeCurrentTime;
  const progress = getPlaybackProgress(displayedCurrentTime, safeDuration);
  const accessibilityMax = safeDuration || Math.max(displayedCurrentTime, 1);
  const isOverlay = tone === 'overlay';
  const isSeekEnabled = Boolean(onSeek) && safeDuration > 0;
  const progressAccessibilityLabel =
    accessibilityLabel ??
    `Playback progress ${formatPlaybackTime(displayedCurrentTime)} of ${formatPlaybackTime(safeDuration)}`;
  const progressAccessibilityValue = {
    max: accessibilityMax,
    min: 0,
    now: displayedCurrentTime,
    text: `${formatPlaybackTime(displayedCurrentTime)} of ${formatPlaybackTime(safeDuration)}`,
  };
  const progressFill = (
    <View
      style={[
        styles.fill,
        isOverlay && styles.overlayFill,
        { width: `${progress * 100}%` },
      ]}
    />
  );

  function requestSeek(time: number): void {
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

  function handleTrackLayout(event: LayoutChangeEvent): void {
    trackWidth.current = event.nativeEvent.layout.width;
  }

  function handleTrackPress(event: GestureResponderEvent): void {
    requestSeek(
      getPlaybackSeekTime(event.nativeEvent.locationX, trackWidth.current, safeDuration)
    );
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent): void {
    const seekStep = Math.max(5, safeDuration * 0.05);

    if (event.nativeEvent.actionName === 'increment') {
      requestSeek(displayedCurrentTime + seekStep);
    } else if (event.nativeEvent.actionName === 'decrement') {
      requestSeek(displayedCurrentTime - seekStep);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(displayedCurrentTime)}
        </Text>
        <Text style={[styles.timeText, isOverlay && styles.overlayTimeText]}>
          {formatPlaybackTime(safeDuration)}
        </Text>
      </View>
      {isSeekEnabled ? (
        <BreathingPressable
          accessibilityActions={[
            { label: 'Seek forward', name: 'increment' },
            { label: 'Seek backward', name: 'decrement' },
          ]}
          accessibilityHint="Tap or adjust to seek through this session."
          accessibilityLabel={progressAccessibilityLabel}
          accessibilityRole="adjustable"
          accessibilityValue={progressAccessibilityValue}
          onAccessibilityAction={handleAccessibilityAction}
          onLayout={handleTrackLayout}
          onPress={handleTrackPress}
          style={styles.seekTarget}
        >
          <View style={[styles.track, isOverlay && styles.overlayTrack]}>{progressFill}</View>
        </BreathingPressable>
      ) : (
        <View
          accessible
          accessibilityLabel={progressAccessibilityLabel}
          accessibilityRole="progressbar"
          accessibilityValue={progressAccessibilityValue}
          style={[styles.track, isOverlay && styles.overlayTrack]}
        >
          {progressFill}
        </View>
      )}
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
  seekTarget: {
    justifyContent: 'center',
    minHeight: 44,
    width: '100%',
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
