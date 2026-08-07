import { AlertCircle, Heart, ShieldCheck } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { WELLNESS_DISCLAIMER } from '../constants/disclaimer';
import { colors, gradients, theme } from '../theme';

type WelcomeScreenProps = {
  errorMessage: string | null;
  isAccepting: boolean;
  onAccept: () => Promise<void>;
};

export function WelcomeScreen({ errorMessage, isAccepting, onAccept }: WelcomeScreenProps) {
  return (
    <GradientScreen gradientColors={gradients.welcome} includeBottomSafeArea scroll>
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <Heart color={colors.rose} fill={colors.roseSoft} size={32} />
        </View>
        <Text style={styles.brand}>Heart Hugs</Text>
        <Text style={styles.subtitle}>Gentle guided care for softer moments.</Text>
      </View>

      <View style={styles.disclaimerPanel}>
        <View style={styles.panelHeader}>
          <ShieldCheck color={colors.leafDeep} size={22} />
          <Text style={styles.panelTitle}>Wellness Disclaimer</Text>
        </View>
        <Text style={styles.disclaimerText}>{WELLNESS_DISCLAIMER}</Text>
      </View>

      {errorMessage ? (
        <View accessibilityLiveRegion="assertive" style={styles.errorPanel}>
          <AlertCircle color={colors.rose} size={19} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: isAccepting, disabled: isAccepting }}
        disabled={isAccepting}
        onPress={onAccept}
        style={({ pressed }) => [
          styles.acceptButton,
          isAccepting && styles.acceptButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        {isAccepting ? <ActivityIndicator color={colors.offWhite} size="small" /> : null}
        <Text style={styles.acceptText}>
          {isAccepting ? 'Saving acceptance…' : 'I understand and agree'}
        </Text>
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  brand: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
    textAlign: 'center',
  },
  disclaimerPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  disclaimerText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.lg,
  },
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.leafDeep,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  acceptButtonDisabled: {
    opacity: 0.72,
  },
  errorPanel: {
    alignItems: 'center',
    backgroundColor: colors.roseSoft,
    borderColor: colors.rose,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  errorText: {
    color: colors.navy,
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  acceptText: {
    color: colors.offWhite,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
});
