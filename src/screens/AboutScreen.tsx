import { ArrowLeft, BadgeCheck, HeartHandshake, Info, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { WELLNESS_DISCLAIMER, WELLNESS_DISCLAIMER_VERSION } from '../constants/disclaimer';
import { therapistProfile } from '../data/therapist';
import { colors, theme } from '../theme';
import { RootStackScreenProps } from '../types/navigation';

export function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  return (
    <GradientScreen contentContainerStyle={styles.screen} includeBottomSafeArea scroll>
      <View style={styles.topBar}>
        <BreathingPressable
          accessibilityLabel="Return to the previous screen"
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          onPress={navigation.goBack}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </BreathingPressable>
        <Text style={styles.topBarTitle}>Settings</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.iconMark}>
          <HeartHandshake color={colors.coralDeep} size={27} />
        </View>
        <Text style={styles.title}>About Heart Hugs</Text>
        <Text style={styles.subtitle}>{therapistProfile.role}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.name}>{therapistProfile.name}</Text>
        <Text style={styles.bodyText}>{therapistProfile.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        {therapistProfile.credentials.map((credential) => (
          <View key={credential} style={styles.credentialRow}>
            <BadgeCheck color={colors.leafDeep} size={19} />
            <Text style={styles.credentialText}>{credential}</Text>
          </View>
        ))}
      </View>

      <View style={styles.safetyPanel}>
        <View style={styles.panelHeader}>
          <ShieldCheck color={colors.coralDeep} size={21} />
          <Text style={styles.sectionTitle}>Safety & support</Text>
        </View>
        <Text style={styles.bodyText}>{WELLNESS_DISCLAIMER}</Text>
        <Text style={styles.safetyNote}>
          The 988 resource above is for the United States. Outside the United States, contact
          your local emergency service or crisis support service.
        </Text>
        <Text style={styles.versionText}>Disclaimer version {WELLNESS_DISCLAIMER_VERSION}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Info color={colors.leafDeep} size={20} />
          <Text style={styles.sectionTitle}>Privacy</Text>
        </View>
        <Text style={styles.bodyText}>
          Saved practices, recent activity, and playback progress stay on this device. Heart Hugs
          does not require an account for these features.
        </Text>
      </View>

      <View style={styles.previewPanel}>
        <Text style={styles.previewTitle}>Content status</Text>
        <Text style={styles.bodyText}>
          This build uses prototype media. Production recordings, transcripts, clinical review,
          and verified practitioner details are required before public release.
        </Text>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
  },
  header: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  iconMark: {
    alignItems: 'center',
    backgroundColor: colors.peachSoft,
    borderColor: colors.roseSoft,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  subtitle: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  section: {
    gap: theme.spacing.sm,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  safetyPanel: {
    backgroundColor: colors.roseSoft,
    borderColor: colors.rose,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  previewPanel: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.leaf,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  credentialRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 52,
    padding: theme.spacing.md,
  },
  credentialText: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  bodyText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.lg,
  },
  safetyNote: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  versionText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
  },
  previewTitle: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
  },
});
