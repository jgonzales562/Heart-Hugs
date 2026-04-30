import { Pause, Play } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, theme } from '../theme';

type PlaybackToggleProps = {
  accessibilityLabel: string;
  isPlaying: boolean;
  onPress: () => void;
  variant?: 'large' | 'compact';
};

export function PlaybackToggle({
  accessibilityLabel,
  isPlaying,
  onPress,
  variant = 'compact',
}: PlaybackToggleProps) {
  const isLarge = variant === 'large';
  const iconSize = isLarge ? 38 : 20;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isLarge ? styles.largeButton : styles.compactButton,
        pressed && styles.pressed,
      ]}
    >
      {isPlaying ? (
        <Pause color={colors.offWhite} fill={colors.offWhite} size={iconSize} />
      ) : (
        <Play color={colors.offWhite} fill={colors.offWhite} size={iconSize} />
      )}
    </Pressable>
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
    height: 104,
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    width: 104,
  },
  compactButton: {
    backgroundColor: colors.transparentNavy,
    height: 44,
    width: 44,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
