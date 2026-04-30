import { BadgeCheck, HeartHandshake, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { WELLNESS_DISCLAIMER } from '../constants/disclaimer';
import { therapistProfile } from '../data/therapist';
import { colors, theme } from '../theme';

export function AboutScreen() {
  return (
    <GradientScreen scroll>
      <View style={styles.header}>
        <View style={styles.iconMark}>
          <HeartHandshake color={colors.tealDeep} size={26} />
        </View>
        <Text style={styles.title}>About</Text>
        <Text style={styles.subtitle}>{therapistProfile.role}</Text>
      </View>

      <View style={styles.profilePanel}>
        <Text style={styles.name}>{therapistProfile.name}</Text>
        <Text style={styles.bio}>{therapistProfile.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        <View style={styles.credentialsList}>
          {therapistProfile.credentials.map((credential) => (
            <View key={credential} style={styles.credentialRow}>
              <BadgeCheck color={colors.tealDeep} size={18} />
              <Text style={styles.credentialText}>{credential}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.disclaimerPanel}>
        <View style={styles.disclaimerHeader}>
          <ShieldCheck color={colors.rose} size={20} />
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
        </View>
        <Text style={styles.disclaimerText}>{WELLNESS_DISCLAIMER}</Text>
      </View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  iconMark: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  title: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  subtitle: {
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  profilePanel: {
    backgroundColor: colors.warmWhite,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  name: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  bio: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.lg,
  },
  section: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  credentialsList: {
    gap: theme.spacing.sm,
  },
  credentialRow: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  credentialText: {
    color: colors.inkMuted,
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  disclaimerPanel: {
    backgroundColor: colors.warmWhite,
    borderColor: colors.roseSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
  },
  disclaimerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  disclaimerTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  disclaimerText: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
});
