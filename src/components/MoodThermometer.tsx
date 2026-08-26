import { LinearGradient } from 'expo-linear-gradient';
import { Check, Heart, Sparkles, Thermometer } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
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

const LOGGED_CONFIRMATION_DURATION_MS = 3_000;
const celebrationParticles = [
  { color: colors.hotPink, delay: 0.02, height: 8, rotation: '-110deg', width: 16, x: -142, y: -72 },
  { color: colors.sunshine, delay: 0.08, height: 11, rotation: '-68deg', width: 11, x: -124, y: -118 },
  { color: colors.aqua, delay: 0.14, height: 7, rotation: '-42deg', width: 17, x: -94, y: -146 },
  { color: colors.magenta, delay: 0.04, height: 10, rotation: '74deg', width: 10, x: -64, y: -92 },
  { color: colors.orange, delay: 0.11, height: 7, rotation: '120deg', width: 15, x: -36, y: -154 },
  { color: colors.leafBright, delay: 0.17, height: 10, rotation: '48deg', width: 10, x: -12, y: -112 },
  { color: colors.sunshine, delay: 0.05, height: 8, rotation: '145deg', width: 18, x: 18, y: -158 },
  { color: colors.hotPink, delay: 0.13, height: 11, rotation: '88deg', width: 11, x: 46, y: -106 },
  { color: colors.aqua, delay: 0.03, height: 7, rotation: '190deg', width: 16, x: 76, y: -148 },
  { color: colors.orange, delay: 0.09, height: 10, rotation: '130deg', width: 10, x: 104, y: -94 },
  { color: colors.magenta, delay: 0.16, height: 8, rotation: '220deg', width: 17, x: 132, y: -126 },
  { color: colors.leafBright, delay: 0.06, height: 11, rotation: '170deg', width: 11, x: 148, y: -68 },
] as const;
const shouldUseNativeDriver = Platform.OS !== 'web';

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
  const [celebrationProgress] = useState(() => new Animated.Value(0));
  const loggedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useRef(false);
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

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      if (isMounted) {
        reduceMotion.current = isEnabled;
      }
    });

    return () => {
      isMounted = false;
      celebrationProgress.stopAnimation();

      if (loggedResetTimer.current) {
        clearTimeout(loggedResetTimer.current);
      }
    };
  }, [celebrationProgress]);

  function updateMoodValue(value: number) {
    setMoodValue(Math.round(clampMoodValue(value)));
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

    if (loggedResetTimer.current) {
      clearTimeout(loggedResetTimer.current);
    }

    celebrationProgress.stopAnimation();
    celebrationProgress.setValue(0);

    if (!reduceMotion.current) {
      Animated.timing(celebrationProgress, {
        duration: 1_600,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: shouldUseNativeDriver,
      }).start();
    }

    loggedResetTimer.current = setTimeout(() => {
      setHasJustLogged(false);
      loggedResetTimer.current = null;
    }, LOGGED_CONFIRMATION_DURATION_MS);
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
          onChangeText={setReflection}
          onPressIn={reflectionBreatheIn}
          onPressOut={reflectionBreatheOut}
          placeholder="Write something about this feeling…"
          placeholderTextColor={colors.textSecondary}
          style={styles.reflectionInput}
          textAlignVertical="top"
          value={reflection}
        />
      </Animated.View>

      <View style={styles.celebrationStage}>
        <View pointerEvents="none" style={styles.celebrationLayer}>
          <Animated.View
            style={[
              styles.celebrationGlow,
              {
                opacity: celebrationProgress.interpolate({
                  inputRange: [0, 0.12, 0.52, 1],
                  outputRange: [0, 0.62, 0.26, 0],
                }),
                transform: [
                  {
                    scale: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1.6],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.celebrationRing,
              {
                opacity: celebrationProgress.interpolate({
                  inputRange: [0, 0.1, 0.68, 1],
                  outputRange: [0, 0.92, 0.34, 0],
                }),
                transform: [
                  {
                    scale: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.58, 1.48],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.celebrationRing,
              styles.celebrationRingAqua,
              {
                opacity: celebrationProgress.interpolate({
                  inputRange: [0, 0.12, 0.26, 0.82, 1],
                  outputRange: [0, 0, 0.86, 0.28, 0],
                }),
                transform: [
                  {
                    scale: celebrationProgress.interpolate({
                      inputRange: [0, 0.12, 1],
                      outputRange: [0.46, 0.46, 1.36],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.celebrationHeart,
              {
                opacity: celebrationProgress.interpolate({
                  inputRange: [0, 0.12, 0.74, 1],
                  outputRange: [0, 1, 0.92, 0],
                }),
                transform: [
                  {
                    translateX: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -24],
                    }),
                  },
                  {
                    translateY: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -104],
                    }),
                  },
                  {
                    rotate: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-12deg', '18deg'],
                    }),
                  },
                  {
                    scale: celebrationProgress.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.4, 1.25, 0.82],
                    }),
                  },
                ],
              },
            ]}
          >
            <Heart color={colors.hotPink} fill={colors.roseSoft} size={27} strokeWidth={2.5} />
          </Animated.View>
          <Animated.View
            style={[
              styles.celebrationSparkle,
              {
                opacity: celebrationProgress.interpolate({
                  inputRange: [0, 0.16, 0.76, 1],
                  outputRange: [0, 1, 0.9, 0],
                }),
                transform: [
                  {
                    translateX: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 25],
                    }),
                  },
                  {
                    translateY: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -88],
                    }),
                  },
                  {
                    rotate: celebrationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '72deg'],
                    }),
                  },
                  {
                    scale: celebrationProgress.interpolate({
                      inputRange: [0, 0.24, 1],
                      outputRange: [0.45, 1.38, 0.78],
                    }),
                  },
                ],
              },
            ]}
          >
            <Sparkles color={colors.sunshine} fill={colors.sunshineSoft} size={29} strokeWidth={2.6} />
          </Animated.View>
          {celebrationParticles.map((particle) => (
            <Animated.View
              key={`${particle.x}-${particle.y}`}
              style={[
                styles.celebrationParticle,
                {
                  backgroundColor: particle.color,
                  borderRadius: particle.height === particle.width ? theme.radius.full : 2,
                  height: particle.height,
                  opacity: celebrationProgress.interpolate({
                    inputRange: [0, particle.delay, particle.delay + 0.12, 0.78, 1],
                    outputRange: [0, 0, 1, 0.94, 0],
                  }),
                  transform: [
                    {
                      translateX: celebrationProgress.interpolate({
                        inputRange: [0, particle.delay, 1],
                        outputRange: [0, 0, particle.x],
                      }),
                    },
                    {
                      translateY: celebrationProgress.interpolate({
                        inputRange: [0, particle.delay, 1],
                        outputRange: [0, 0, particle.y],
                      }),
                    },
                    {
                      rotate: celebrationProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', particle.rotation],
                      }),
                    },
                    {
                      scale: celebrationProgress.interpolate({
                        inputRange: [0, particle.delay, particle.delay + 0.16, 1],
                        outputRange: [0.35, 0.35, 1.24, 0.68],
                      }),
                    },
                  ],
                  width: particle.width,
                },
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={{
            transform: [
              {
                scale: celebrationProgress.interpolate({
                  inputRange: [0, 0.1, 0.24, 0.42, 0.62, 1],
                  outputRange: [1, 1.12, 0.96, 1.07, 0.99, 1],
                }),
              },
            ],
          }}
        >
          <BreathingPressable
            accessibilityLabel={`Log mood: ${descriptor.label}, ${moodValue} out of 100`}
            accessibilityRole="button"
            containerStyle={styles.logButtonContainer}
            onPress={logMood}
            style={[styles.logButton, hasJustLogged && styles.loggedButton]}
          >
            {hasJustLogged ? <Check color={colors.navy} size={18} strokeWidth={2.8} /> : null}
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.logButtonText, hasJustLogged && styles.loggedButtonText]}
            >
              {hasJustLogged ? 'Feeling logged' : 'Log this feeling'}
            </Text>
          </BreathingPressable>
        </Animated.View>
      </View>

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
  celebrationStage: {
    overflow: 'visible',
    position: 'relative',
  },
  celebrationLayer: {
    bottom: 0,
    height: 174,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  celebrationRing: {
    borderColor: colors.hotPink,
    borderRadius: theme.radius.full,
    borderWidth: 3,
    bottom: 0,
    height: 52,
    left: '8%',
    position: 'absolute',
    right: '8%',
  },
  celebrationRingAqua: {
    borderColor: colors.aqua,
    left: '13%',
    right: '13%',
  },
  celebrationGlow: {
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    bottom: 5,
    height: 42,
    left: '20%',
    position: 'absolute',
    right: '20%',
  },
  celebrationHeart: {
    alignItems: 'center',
    bottom: 14,
    left: '50%',
    marginLeft: -14,
    position: 'absolute',
  },
  celebrationSparkle: {
    alignItems: 'center',
    bottom: 14,
    left: '50%',
    marginLeft: -12,
    position: 'absolute',
  },
  celebrationParticle: {
    bottom: 21,
    left: '50%',
    marginLeft: -5,
    position: 'absolute',
  },
  logButtonContainer: {
    position: 'relative',
    zIndex: 1,
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
