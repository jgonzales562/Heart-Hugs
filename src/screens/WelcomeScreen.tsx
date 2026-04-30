import { Heart, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { WELLNESS_DISCLAIMER } from '../constants/disclaimer';
import { colors, gradients, theme } from '../theme';

type WelcomeScreenProps = {
  onAccept: () => Promise<void>;
};

export function WelcomeScreen({ onAccept }: WelcomeScreenProps) {
  return (
    <GradientScreen gradientColors={gradients.screen} scroll>
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <Heart color={colors.rose} fill={colors.roseSoft} size={32} />
        </View>
        <Text style={styles.brand}>Heart Hugs</Text>
        <Text style={styles.subtitle}>Gentle guided care for softer moments.</Text>
      </View>

      <View style={styles.disclaimerPanel}>
        <View style={styles.panelHeader}>
          <ShieldCheck color={colors.tealDeep} size={22} />
          <Text style={styles.panelTitle}>Wellness Disclaimer</Text>
        </View>
        <Text style={styles.disclaimerText}>{WELLNESS_DISCLAIMER}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onAccept}
        style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}
      >
        <Text style={styles.acceptText}>I understand and agree</Text>
      </Pressable>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  brand: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
    textAlign: 'center',
  },
  disclaimerPanel: {
    backgroundColor: colors.warmWhite,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  panelTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  disclaimerText: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.lg,
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  acceptText: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
});
