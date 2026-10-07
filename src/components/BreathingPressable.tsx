import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '../hooks/useReducedMotion';

const EXPANDED_SCALE = 1.085;
const INHALE_DURATION_MS = 1_000;
const FINISH_INHALE_DURATION_MS = 500;
const EXHALE_DURATION_MS = 1_400;
const SHOULD_USE_NATIVE_DRIVER = Platform.OS !== 'web';

type BreathingPressableProps = Omit<PressableProps, 'style'> & {
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

type BreathingPressAnimation = {
  readonly animatedStyle: Animated.WithAnimatedValue<ViewStyle>;
  readonly breatheIn: () => void;
  readonly breatheOut: () => void;
};

export function useBreathingPressAnimation(): BreathingPressAnimation {
  const [scale] = useState(() => new Animated.Value(1));
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isFullyExpanded = useRef(false);
  const isReducedMotion = useReducedMotion();
  const resetAnimation = useCallback((): void => {
    activeAnimation.current?.stop();
    activeAnimation.current = null;
    isFullyExpanded.current = false;
    scale.setValue(1);
  }, [scale]);

  useEffect(() => {
    if (isReducedMotion) {
      resetAnimation();
    }
  }, [isReducedMotion, resetAnimation]);

  useEffect(() => {
    return () => {
      activeAnimation.current?.stop();
      activeAnimation.current = null;
    };
  }, []);

  function start(animation: Animated.CompositeAnimation, onComplete?: () => void): void {
    activeAnimation.current?.stop();
    activeAnimation.current = animation;
    animation.start(({ finished }) => {
      if (activeAnimation.current === animation) {
        activeAnimation.current = null;
      }

      if (finished) {
        onComplete?.();
      }
    });
  }

  function breatheIn(): void {
    if (isReducedMotion) {
      resetAnimation();
      return;
    }

    isFullyExpanded.current = false;
    start(
      Animated.timing(scale, {
        duration: INHALE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        toValue: EXPANDED_SCALE,
        useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
      }),
      () => {
        isFullyExpanded.current = true;
      }
    );
  }

  function breatheOut(): void {
    if (isReducedMotion) {
      resetAnimation();
      return;
    }

    const exhale = Animated.timing(scale, {
      duration: EXHALE_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      toValue: 1,
      useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
    });
    const releaseAnimation = isFullyExpanded.current
      ? exhale
      : Animated.sequence([
          Animated.timing(scale, {
            duration: FINISH_INHALE_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            toValue: EXPANDED_SCALE,
            useNativeDriver: SHOULD_USE_NATIVE_DRIVER,
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
}: BreathingPressableProps): ReactElement {
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
