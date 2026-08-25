import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Heart, ShieldCheck } from 'lucide-react-native';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { WELLNESS_DISCLAIMER } from '../constants/disclaimer';
import { welcomeArtwork } from '../data/sessionArtwork';
import { colors, gradients, theme } from '../theme';

type WelcomeScreenProps = {
  errorMessage: string | null;
  isAccepting: boolean;
  onAccept: () => Promise<void>;
};

export function WelcomeScreen({ errorMessage, isAccepting, onAccept }: WelcomeScreenProps) {
  return (
    <GradientScreen gradientColors={gradients.welcome} includeBottomSafeArea scroll>
      <ImageBackground imageStyle={styles.heroImage} source={welcomeArtwork} style={styles.hero}>
        <LinearGradient
          colors={['rgba(27, 16, 55, 0.06)', 'rgba(27, 16, 55, 0.88)']}
          style={styles.heroOverlay}
        >
          <View style={styles.brandMark}>
            <Heart color={colors.hotPink} fill={colors.hotPink} size={28} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>A SOFTER PLACE TO LAND</Text>
            <Text style={styles.brand}>Heart Hugs</Text>
            <Text style={styles.subtitle}>Small practices. Vivid moments of care.</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

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

      <BreathingPressable
        accessibilityRole="button"
        accessibilityState={{ busy: isAccepting, disabled: isAccepting }}
        disabled={isAccepting}
        onPress={onAccept}
        style={[
          styles.acceptButton,
          isAccepting && styles.acceptButtonDisabled,
        ]}
      >
        {isAccepting ? <ActivityIndicator color={colors.offWhite} size="small" /> : null}
        <Text style={styles.acceptText}>
          {isAccepting ? 'Saving acceptance…' : 'I understand and agree'}
        </Text>
      </BreathingPressable>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 440,
  },
  heroImage: {
    borderRadius: 36,
  },
  heroOverlay: {
    borderRadius: 36,
    height: 440,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.54)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  heroCopy: {
    gap: theme.spacing.xs,
  },
  heroEyebrow: {
    color: colors.sunshine,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.7,
  },
  brand: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 42,
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  subtitle: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
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
    backgroundColor: colors.violetDeep,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
