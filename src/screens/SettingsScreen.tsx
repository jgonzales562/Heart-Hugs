import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  HeartHandshake,
  Info,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import {
  CRISIS_SUPPORT_MESSAGE,
  WELLNESS_DISCLAIMER,
  WELLNESS_DISCLAIMER_VERSION,
} from '../constants/disclaimer';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import type { RootStackScreenProps } from '../types/navigation';
import { tryOpenExternalResource } from '../utils/externalResources';

const CRISIS_CALL_URL = 'tel:988';
const CRISIS_TEXT_URL = 'sms:988';
const CRISIS_WEBSITE_URL = 'https://988lifeline.org';
const RESOURCE_ERROR_MESSAGE =
  'That resource could not be opened on this device. You can still call or text 988 directly in the United States and its territories.';

export function SettingsScreen({
  navigation,
}: RootStackScreenProps<'Settings'>): ReactElement {
  const { storageError } = useWellness();
  const [resourceError, setResourceError] = useState<string | null>(null);
  const launchGeneration = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  async function openResource(url: string): Promise<void> {
    const generation = ++launchGeneration.current;
    setResourceError(null);

    const didOpen = await tryOpenExternalResource(url);

    if (isMounted.current && generation === launchGeneration.current && !didOpen) {
      setResourceError(RESOURCE_ERROR_MESSAGE);
    }
  }

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
          <ArrowLeft accessible={false} color={colors.textPrimary} size={22} />
        </BreathingPressable>
        <Text accessibilityRole="header" style={styles.topBarTitle}>
          Settings
        </Text>
      </View>

      <View style={styles.header}>
        <View style={styles.iconMark}>
          <HeartHandshake accessible={false} color={colors.coralDeep} size={27} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          About Heart Hugs
        </Text>
        <Text style={styles.subtitle}>Guided wellness practices for everyday care</Text>
      </View>

      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.name}>
          A private, local-first space
        </Text>
        <Text style={styles.bodyText}>
          Heart Hugs helps you choose a short guided practice for the moment you are in, save the
          sessions you value, and return to them at your own pace.
        </Text>
      </View>

      <View style={styles.safetyPanel}>
        <View style={styles.panelHeader}>
          <ShieldCheck accessible={false} color={colors.coralDeep} size={21} />
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Safety & support
          </Text>
        </View>
        <Text style={styles.bodyText}>{WELLNESS_DISCLAIMER}</Text>
        <Text style={styles.safetyNote}>{CRISIS_SUPPORT_MESSAGE}</Text>
        <View style={styles.resourceActions}>
          <BreathingPressable
            accessibilityHint="Opens the phone app with 988 ready to call."
            accessibilityRole="link"
            containerStyle={styles.resourceActionContainer}
            onPress={() => void openResource(CRISIS_CALL_URL)}
            style={styles.resourceAction}
          >
            <PhoneCall accessible={false} color={colors.navy} size={17} />
            <Text style={styles.resourceActionText}>Call 988</Text>
          </BreathingPressable>
          <BreathingPressable
            accessibilityHint="Opens the messaging app with 988 as the recipient."
            accessibilityRole="link"
            containerStyle={styles.resourceActionContainer}
            onPress={() => void openResource(CRISIS_TEXT_URL)}
            style={styles.resourceAction}
          >
            <MessageCircle accessible={false} color={colors.navy} size={17} />
            <Text style={styles.resourceActionText}>Text 988</Text>
          </BreathingPressable>
          <BreathingPressable
            accessibilityHint="Opens the official 988 Lifeline website."
            accessibilityRole="link"
            containerStyle={styles.resourceActionContainer}
            onPress={() => void openResource(CRISIS_WEBSITE_URL)}
            style={styles.resourceAction}
          >
            <ExternalLink accessible={false} color={colors.navy} size={17} />
            <Text style={styles.resourceActionText}>Visit 988 Lifeline</Text>
          </BreathingPressable>
        </View>
        {resourceError ? (
          <Text
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
            style={styles.resourceError}
          >
            {resourceError}
          </Text>
        ) : null}
        <Text style={styles.versionText}>Disclaimer version {WELLNESS_DISCLAIMER_VERSION}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Info accessible={false} color={colors.leafDeep} size={20} />
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Privacy
          </Text>
        </View>
        <Text style={styles.bodyText}>
          Saved practices, numeric mood check-ins, recent activity, and playback progress stay in
          this app’s local device storage and are not uploaded. This local data is not encrypted,
          and Heart Hugs does not require an account.
        </Text>
      </View>

      {storageError ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.storageWarningPanel}
        >
          <View style={styles.panelHeader}>
            <AlertCircle accessible={false} color={colors.coralDeep} size={20} />
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Storage warning
            </Text>
          </View>
          <Text style={styles.bodyText}>{storageError}</Text>
        </View>
      ) : null}

      <View style={styles.previewPanel}>
        <Text accessibilityRole="header" style={styles.previewTitle}>
          Content status
        </Text>
        <Text style={styles.bodyText}>
          This build uses prototype media. Production recordings, transcripts, and clinical review
          are required before public release.
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
  storageWarningPanel: {
    backgroundColor: colors.sunshineSoft,
    borderColor: colors.orange,
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
  resourceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  resourceActionContainer: {
    flexGrow: 1,
  },
  resourceAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.rose,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  resourceActionText: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
  },
  resourceError: {
    color: colors.coralDeep,
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
