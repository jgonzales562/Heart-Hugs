import { LinearGradient } from 'expo-linear-gradient';
import { BookHeart, CalendarHeart, Settings } from 'lucide-react-native';
import { memo, type ReactElement } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { useWellness } from '../state/WellnessProvider';
import type { MoodCheckIn } from '../state/wellnessState';
import { colors, theme } from '../theme';
import type { MainTabScreenProps } from '../types/navigation';
import {
  formatCheckInDateTime,
  getMoodBand,
  getMoodDescriptor,
  normalizeMoodScore,
  type MoodBand,
} from '../utils/mood';

const METER_GRADIENT = [colors.violetDeep, colors.hotPink, colors.sunshine] as const;
const GRADIENT_START = { x: 0, y: 0 } as const;
const HORIZONTAL_GRADIENT_END = { x: 1, y: 0 } as const;
const CHECK_IN_GRADIENTS: Readonly<Record<MoodBand, readonly [string, string]>> = {
  bright: [colors.sunshineSoft, colors.vitalitySoft],
  good: [colors.tealMist, colors.mintSoft],
  low: [colors.roseSoft, colors.peachSoft],
  middle: [colors.peachSoft, colors.sunshineSoft],
  'very-low': [colors.lavender, colors.lavenderSoft],
};

export function CheckInsScreen({
  navigation,
}: MainTabScreenProps<'CheckIns'>): ReactElement {
  const { state } = useWellness();
  const checkIns = state.moodCheckIns;

  return (
    <GradientScreen contentContainerStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={checkIns}
        initialNumToRender={8}
        ItemSeparatorComponent={CheckInSeparator}
        keyExtractor={getCheckInKey}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View accessible={false} style={styles.emptyIcon}>
              <CalendarHeart accessible={false} color={colors.magentaDeep} size={29} />
            </View>
            <Text accessibilityRole="header" style={styles.emptyTitle}>
              Your check-ins will appear here
            </Text>
            <Text style={styles.emptyText}>
              Use the mood thermometer on Today to record how you feel.
            </Text>
            <BreathingPressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Today')}
              style={styles.checkInButton}
            >
              <BookHeart accessible={false} color={colors.navy} size={18} />
              <Text style={styles.checkInButtonText}>Start a check-in</Text>
            </BreathingPressable>
          </View>
        }
        ListHeaderComponent={
          <View
            style={[
              styles.listHeader,
              checkIns.length === 0
                ? styles.listHeaderBeforeEmpty
                : styles.listHeaderBeforeHistory,
            ]}
          >
            <View style={styles.topBar}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>MOOD HISTORY</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  Your emotional check-ins
                </Text>
              </View>
              <BreathingPressable
                accessibilityLabel="Open settings and safety information"
                accessibilityRole="button"
                onPress={() => navigation.navigate('Settings')}
                style={styles.iconButton}
              >
                <Settings accessible={false} color={colors.textPrimary} size={21} />
              </BreathingPressable>
            </View>

            <View style={styles.summaryRow}>
              <SummaryCard label="Check-ins" value={checkIns.length} />
              <SummaryCard label="Latest score" value={checkIns[0]?.value ?? '—'} />
            </View>

            {checkIns.length > 0 ? (
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Most recent first
              </Text>
            ) : null}
          </View>
        }
        renderItem={renderCheckIn}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        windowSize={7}
      />
    </GradientScreen>
  );
}

type SummaryCardProps = {
  readonly label: string;
  readonly value: number | string;
};

function SummaryCard({ label, value }: SummaryCardProps): ReactElement {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type CheckInCardProps = {
  readonly checkIn: MoodCheckIn;
};

const CheckInCard = memo(function CheckInCard({
  checkIn,
}: CheckInCardProps): ReactElement {
  const value = normalizeMoodScore(checkIn.value);
  const descriptor = getMoodDescriptor(value);
  const formattedDate = formatCheckInDateTime(checkIn.recordedAt);
  const cardColors = CHECK_IN_GRADIENTS[getMoodBand(value)];
  const meterWidth = `${value}%` as `${number}%`;

  return (
    <LinearGradient
      accessible
      accessibilityLabel={`${descriptor.label}, ${value} out of 100, ${formattedDate}`}
      colors={cardColors}
      style={styles.checkInCard}
    >
      <View style={styles.checkInHeader}>
        <View style={styles.checkInCopy}>
          <Text style={styles.moodLabel}>{descriptor.label}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{value}</Text>
          <Text style={styles.scoreRange}>/100</Text>
        </View>
      </View>

      <View accessible={false} style={styles.meterTrack}>
        <LinearGradient
          colors={METER_GRADIENT}
          end={HORIZONTAL_GRADIENT_END}
          start={GRADIENT_START}
          style={[styles.meterFill, { width: meterWidth }]}
        />
      </View>
    </LinearGradient>
  );
});

function renderCheckIn({ item }: ListRenderItemInfo<MoodCheckIn>): ReactElement {
  return <CheckInCard checkIn={item} />;
}

function getCheckInKey(checkIn: MoodCheckIn): string {
  return checkIn.id;
}

function CheckInSeparator(): ReactElement {
  return <View style={styles.checkInSeparator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 0,
    paddingTop: theme.spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 116,
  },
  listHeader: {
    gap: theme.spacing.xl,
  },
  listHeaderBeforeEmpty: {
    marginBottom: theme.spacing.xl,
  },
  listHeaderBeforeHistory: {
    marginBottom: theme.spacing.md,
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.8,
    lineHeight: theme.typography.lineHeight.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 36,
    letterSpacing: -1,
    lineHeight: 43,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xxs,
    padding: theme.spacing.lg,
  },
  summaryValue: {
    color: colors.magentaDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.roseSoft,
    borderRadius: theme.radius.full,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: 'center',
  },
  checkInButton: {
    alignItems: 'center',
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  checkInButtonText: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  checkInSeparator: {
    height: theme.spacing.md,
  },
  checkInCard: {
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  checkInHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  checkInCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  moodLabel: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  dateText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
  },
  scoreBadge: {
    alignItems: 'baseline',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    minWidth: 78,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  scoreValue: {
    color: colors.violetDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
  },
  scoreRange: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
  },
  meterTrack: {
    backgroundColor: colors.whiteMuted,
    borderRadius: theme.radius.full,
    height: 8,
    overflow: 'hidden',
  },
  meterFill: {
    borderRadius: theme.radius.full,
    height: '100%',
  },
});
