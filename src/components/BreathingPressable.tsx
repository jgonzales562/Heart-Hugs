import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const EXPANDED_SCALE = 1.085;
const INHALE_DURATION_MS = 1_000;
const FINISH_INHALE_DURATION_MS = 500;
const EXHALE_DURATION_MS = 1_400;
const shouldUseNativeDriver = Platform.OS !== 'web';

type BreathingPressableProps = Omit<PressableProps, 'style'> & {
  containerStyle?: StyleProp<ViewStyle>;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

export function useBreathingPressAnimation() {
  const [scale] = useState(() => new Animated.Value(1));
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isFullyExpanded = useRef(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((isEnabled) => {
      reduceMotion.current = isEnabled;
    });

    return () => activeAnimation.current?.stop();
  }, []);

  function start(animation: Animated.CompositeAnimation, onComplete?: () => void) {
    activeAnimation.current?.stop();
    activeAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });
  }

  function breatheIn() {
    isFullyExpanded.current = false;
    start(
      Animated.timing(scale, {
        duration: reduceMotion.current ? 80 : INHALE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        toValue: reduceMotion.current ? 1.02 : EXPANDED_SCALE,
        useNativeDriver: shouldUseNativeDriver,
      }),
      () => {
        isFullyExpanded.current = true;
      }
    );
  }

  function breatheOut() {
    const exhale = Animated.timing(scale, {
      duration: reduceMotion.current ? 100 : EXHALE_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      toValue: 1,
      useNativeDriver: shouldUseNativeDriver,
    });
    const releaseAnimation = isFullyExpanded.current
      ? exhale
      : Animated.sequence([
          Animated.timing(scale, {
            duration: reduceMotion.current ? 40 : FINISH_INHALE_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            toValue: reduceMotion.current ? 1.02 : EXPANDED_SCALE,
            useNativeDriver: shouldUseNativeDriver,
          }),
          exhale,
        ]);

    isFullyExpanded.current = false;
    start(releaseAnimation);
  }

  return {
    animatedStyle: { transform: [{ scale }] },
    breatheIn,
    breatheOut,
  };
}

export function BreathingPressable({
  containerStyle,
  onPressIn,
  onPressOut,
  style,
  ...props
}: BreathingPressableProps) {
  const { animatedStyle, breatheIn, breatheOut } = useBreathingPressAnimation();

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          breatheIn();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          breatheOut();
          onPressOut?.(event);
        }}
        style={style}
      />
    </Animated.View>
  );
}
