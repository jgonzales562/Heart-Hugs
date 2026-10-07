import { Pause, Play } from 'lucide-react-native';
import { useRef, type ReactElement } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { BreathingPressable } from './BreathingPressable';
import { colors, theme } from '../theme';

type PlaybackToggleProps = {
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly isPending?: boolean;
  readonly isPlaying: boolean;
  readonly onPress: () => Promise<void>;
  readonly variant?: 'large' | 'compact';
};

export function PlaybackToggle({
  accessibilityLabel,
  disabled = false,
  isPending = false,
  isPlaying,
  onPress,
  variant = 'compact',
}: PlaybackToggleProps): ReactElement {
  const isLarge = variant === 'large';
  const isDisabled = disabled || isPending;
  const iconSize = isLarge ? 30 : 20;
  const isPressGuardActive = useRef(false);

  function handlePress(): void {
    if (isPressGuardActive.current) {
      return;
    }

    isPressGuardActive.current = true;
    void (async () => {
      try {
        await onPress();
      } catch (error) {
        console.warn('Unable to update playback.', error);
      } finally {
        isPressGuardActive.current = false;
      }
    })();
  }

  return (
    <BreathingPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Toggles playback for this session."
      accessibilityRole="button"
      accessibilityState={{ busy: isPending, disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={isLarge ? 0 : theme.spacing.xs}
      onPress={handlePress}
      style={[
        styles.button,
        isLarge ? styles.largeButton : styles.compactButton,
        isDisabled && styles.disabled,
      ]}
    >
      {isPending ? (
        <ActivityIndicator color={colors.offWhite} size={isLarge ? 'large' : 'small'} />
      ) : isPlaying ? (
        <Pause color={colors.offWhite} fill={colors.offWhite} size={iconSize} />
      ) : (
        <Play color={colors.offWhite} fill={colors.offWhite} size={iconSize} />
      )}
    </BreathingPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderColor: colors.offWhiteTransparent,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
  largeButton: {
    backgroundColor: colors.leafDeep,
    elevation: 6,
    height: 84,
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    width: 84,
  },
  compactButton: {
    backgroundColor: colors.transparentNavy,
    height: 44,
    width: 44,
  },
  disabled: {
    opacity: 0.56,
  },
});
