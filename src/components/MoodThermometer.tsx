import { LinearGradient } from 'expo-linear-gradient';
import { Check, Thermometer } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { colors, theme } from '../theme';
import type { MoodCheckIn } from '../state/wellnessState';
import { BreathingPressable, useBreathingPressAnimation } from './BreathingPressable';

type MoodThermometerProps = {
  latestCheckIn?: MoodCheckIn;
  onDragStateChange?: (isDragging: boolean) => void;
  onLogMood: (value: number, note?: string) => void;
};

const moodDescriptors = [
  { label: 'Running on empty', max: 20, note: 'You can meet this moment gently.' },
  { label: 'Feeling low', max: 40, note: 'A small act of care can be enough.' },
  { label: 'In between', max: 60, note: 'Notice what is here without judgment.' },
  { label: 'Feeling good', max: 80, note: 'Let yourself take in what feels supportive.' },
  { label: 'Feeling bright', max: 100, note: 'Make room for this energy and warmth.' },
] as const;

export function getMoodDescriptor(value: number) {
  const safeValue = clampMoodValue(value);

  return (
    moodDescriptors.find((descriptor) => safeValue <= descriptor.max) ??
    moodDescriptors[moodDescriptors.length - 1]
  );
}

export function MoodThermometer({
  latestCheckIn,
  onDragStateChange,
  onLogMood,
}: MoodThermometerProps) {
  const [moodValue, setMoodValue] = useState(latestCheckIn?.value ?? 50);
  const [reflection, setReflection] = useState('');
  const [hasJustLogged, setHasJustLogged] = useState(false);
  const sliderRef = useRef<View | null>(null);
  const trackWidth = useRef(0);
  const trackLeftPageX = useRef<number | null>(null);
  const dragStartPageX = useRef(0);
  const dragStartValue = useRef(moodValue);
  const dragTrackWidth = useRef(0);
  const isDragging = useRef(false);
  const { animatedStyle, breatheIn, breatheOut } = useBreathingPressAnimation();
  const {
    animatedStyle: reflectionAnimatedStyle,
    breatheIn: reflectionBreatheIn,
    breatheOut: reflectionBreatheOut,
  } = useBreathingPressAnimation();
  const descriptor = getMoodDescriptor(moodValue);
  const progressWidth = `${moodValue}%` as `${number}%`;

  function updateMoodValue(value: number) {
    setMoodValue(Math.round(clampMoodValue(value)));
    setHasJustLogged(false);
  }

  function beginGesture(event: GestureResponderEvent) {
    const pageX = event.nativeEvent.pageX;

    isDragging.current = true;
    dragTrackWidth.current = 0;
    onDragStateChange?.(true);
    breatheIn();

    if (trackLeftPageX.current !== null && trackWidth.current > 0) {
      startDragFromPosition(pageX, trackLeftPageX.current, trackWidth.current);
      return;
    }

    sliderRef.current?.measureInWindow((left, _top, width) => {
      if (!isDragging.current || width <= 0) {
        return;
      }

      trackLeftPageX.current = left;
      trackWidth.current = width;
      startDragFromPosition(pageX, left, width);
    });
  }

  function updateFromGesture(event: GestureResponderEvent) {
    if (dragTrackWidth.current <= 0) {
      return;
    }

    const distanceMoved = event.nativeEvent.pageX - dragStartPageX.current;

    updateMoodValue(
      dragStartValue.current + (distanceMoved / dragTrackWidth.current) * 100
    );
  }

  function handleTrackLayout(event: LayoutChangeEvent) {
    trackWidth.current = event.nativeEvent.layout.width;
    sliderRef.current?.measureInWindow((left, _top, width) => {
      if (width > 0) {
        trackLeftPageX.current = left;
        trackWidth.current = width;
      }
    });
  }

  function startDragFromPosition(pageX: number, trackLeft: number, width: number) {
    const nextValue = clampMoodValue(((pageX - trackLeft) / width) * 100);

    dragStartPageX.current = pageX;
    dragStartValue.current = nextValue;
    dragTrackWidth.current = width;
    updateMoodValue(nextValue);
  }

  function finishGesture() {
    isDragging.current = false;
    dragTrackWidth.current = 0;
    onDragStateChange?.(false);
    breatheOut();
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    if (event.nativeEvent.actionName === 'increment') {
      updateMoodValue(moodValue + 5);
    } else if (event.nativeEvent.actionName === 'decrement') {
      updateMoodValue(moodValue - 5);
    }
  }

  function logMood() {
    onLogMood(moodValue, reflection);
    setReflection('');
    setHasJustLogged(true);
  }

  return (
    <LinearGradient
      colors={[colors.lavenderSoft, colors.peachSoft, colors.tealMist]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.card}
    >
      <View style={styles.heading}>
        <View style={styles.iconMark}>
          <Thermometer color={colors.coralDeep} size={21} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MOOD THERMOMETER</Text>
          <Text style={styles.title}>How are you feeling right now?</Text>
        </View>
      </View>

      <View>
        <View
          accessibilityActions={[
            { label: 'Raise mood rating', name: 'increment' },
            { label: 'Lower mood rating', name: 'decrement' },
          ]}
          accessibilityHint="Drag along the thermometer or adjust in five-point steps."
          accessibilityLabel="Current mood"
          accessibilityRole="adjustable"
          accessibilityValue={{
            max: 100,
            min: 0,
            now: moodValue,
            text: descriptor.label,
          }}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={moodValue}
          aria-valuetext={descriptor.label}
          focusable
          onAccessibilityAction={handleAccessibilityAction}
          onLayout={handleTrackLayout}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={beginGesture}
          onResponderMove={updateFromGesture}
          onResponderRelease={finishGesture}
          onResponderTerminate={finishGesture}
          onResponderTerminationRequest={() => false}
          onStartShouldSetResponder={() => true}
          ref={sliderRef}
          style={styles.sliderTouchTarget}
        >
          <View style={styles.track}>
            <LinearGradient
              colors={[colors.violetDeep, colors.hotPink, colors.sunshine]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={[styles.fill, { width: progressWidth }]}
            />
            <View style={[styles.thumbPosition, { left: progressWidth }]}>
              <Animated.View style={[styles.thumb, animatedStyle]}>
                <View style={styles.thumbCenter} />
              </Animated.View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>Very low</Text>
        <Text style={styles.rangeText}>Feeling bright</Text>
      </View>

      <View style={styles.readingRow}>
        <View style={styles.readingCopy}>
          <Text accessibilityLiveRegion="polite" style={styles.moodLabel}>
            {descriptor.label}
          </Text>
          <Text style={styles.moodNote}>{descriptor.note}</Text>
        </View>
        <View style={styles.scoreBubble}>
          <Text style={styles.score}>{moodValue}</Text>
          <Text style={styles.scoreRange}>/ 100</Text>
        </View>
      </View>

      <Animated.View style={reflectionAnimatedStyle}>
        <TextInput
          accessibilityLabel="Mood reflection"
          maxLength={280}
          multiline
          onChangeText={(text) => {
            setReflection(text);
            setHasJustLogged(false);
          }}
          onPressIn={reflectionBreatheIn}
          onPressOut={reflectionBreatheOut}
          placeholder="Write something about this feeling…"
          placeholderTextColor={colors.textSecondary}
          style={styles.reflectionInput}
          textAlignVertical="top"
          value={reflection}
        />
      </Animated.View>

      <BreathingPressable
        accessibilityLabel={`Log mood: ${descriptor.label}, ${moodValue} out of 100`}
        accessibilityRole="button"
        onPress={logMood}
        style={[styles.logButton, hasJustLogged && styles.loggedButton]}
      >
        {hasJustLogged ? <Check color={colors.navy} size={18} strokeWidth={2.8} /> : null}
        <Text style={[styles.logButtonText, hasJustLogged && styles.loggedButtonText]}>
          {hasJustLogged ? 'Feeling logged' : 'Log this feeling'}
        </Text>
      </BreathingPressable>

      <View style={styles.history}>
        <Text accessibilityLiveRegion="polite" style={styles.historyText}>
          {latestCheckIn
            ? `Last check-in: ${getMoodDescriptor(latestCheckIn.value).label} · ${formatCheckInTime(latestCheckIn.recordedAt)}`
            : 'Your check-ins stay private on this device.'}
        </Text>
        {latestCheckIn?.note ? (
          <Text numberOfLines={3} style={styles.historyNote}>
            “{latestCheckIn.note}”
          </Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}

function clampMoodValue(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 50;
}

function formatCheckInTime(recordedAt: string) {
  const date = new Date(recordedAt);

  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconMark: {
    alignItems: 'center',
    backgroundColor: colors.sunshineSoft,
    borderRadius: theme.radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headingCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  eyebrow: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.5,
    lineHeight: theme.typography.lineHeight.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  readingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  readingCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  moodLabel: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  moodNote: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  scoreBubble: {
    alignItems: 'baseline',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  score: {
    color: colors.violetDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
  },
  scoreRange: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
  },
  sliderTouchTarget: {
    justifyContent: 'center',
    minHeight: 50,
  },
  track: {
    backgroundColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    height: 14,
    position: 'relative',
  },
  fill: {
    borderRadius: theme.radius.full,
    height: '100%',
  },
  thumbPosition: {
    marginLeft: -16,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -16 }],
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.hotPink,
    borderRadius: theme.radius.full,
    borderWidth: 3,
    height: 32,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    width: 32,
  },
  thumbCenter: {
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    height: 9,
    width: 9,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -theme.spacing.sm,
  },
  rangeText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
  },
  reflectionInput: {
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    minHeight: 88,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  logButton: {
    alignItems: 'center',
    backgroundColor: colors.violetDeep,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  loggedButton: {
    backgroundColor: colors.sunshine,
  },
  logButtonText: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
  },
  loggedButtonText: {
    color: colors.navy,
  },
  history: {
    gap: theme.spacing.xxs,
  },
  historyText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: 'center',
  },
  historyNote: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    fontStyle: 'italic',
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: 'center',
  },
});
