import { LinearGradient } from 'expo-linear-gradient';
import { BookHeart, CalendarHeart, Settings } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { getMoodDescriptor } from '../components/MoodThermometer';
import { useWellness } from '../state/WellnessProvider';
import type { MoodCheckIn } from '../state/wellnessState';
import { colors, theme } from '../theme';
import type { MainTabScreenProps } from '../types/navigation';

export function CheckInsScreen({ navigation }: MainTabScreenProps<'CheckIns'>) {
  const { state } = useWellness();
  const checkIns = state.moodCheckIns;
  const reflectionCount = checkIns.filter((checkIn) => Boolean(checkIn.note)).length;

  return (
    <GradientScreen contentContainerStyle={styles.screen} scroll>
      <View style={styles.topBar}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MOOD HISTORY</Text>
          <Text style={styles.title}>Your emotional check-ins</Text>
        </View>
        <BreathingPressable
          accessibilityLabel="Open settings and safety information"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Settings')}
          style={styles.iconButton}
        >
          <Settings color={colors.textPrimary} size={21} />
        </BreathingPressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Check-ins" value={checkIns.length} />
        <SummaryCard label="Reflections" value={reflectionCount} />
      </View>

      {checkIns.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <CalendarHeart color={colors.magentaDeep} size={29} />
          </View>
          <Text style={styles.emptyTitle}>Your check-ins will appear here</Text>
          <Text style={styles.emptyText}>
            Use the mood thermometer on Today to record how you feel and add an optional
            reflection.
          </Text>
          <BreathingPressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Today')}
            style={styles.checkInButton}
          >
            <BookHeart color={colors.navy} size={18} />
            <Text style={styles.checkInButtonText}>Start a check-in</Text>
          </BreathingPressable>
        </View>
      ) : (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Most recent first</Text>
          <View style={styles.checkInList}>
            {checkIns.map((checkIn) => (
              <CheckInCard checkIn={checkIn} key={checkIn.id} />
            ))}
          </View>
        </View>
      )}
    </GradientScreen>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function CheckInCard({ checkIn }: { checkIn: MoodCheckIn }) {
  const descriptor = getMoodDescriptor(checkIn.value);
  const cardColors = getCheckInColors(checkIn.value);

  return (
    <LinearGradient
      accessibilityLabel={`${descriptor.label}, ${checkIn.value} out of 100, ${formatCheckInDateTime(checkIn.recordedAt)}${checkIn.note ? `, reflection: ${checkIn.note}` : ''}`}
      colors={cardColors}
      style={styles.checkInCard}
    >
      <View style={styles.checkInHeader}>
        <View style={styles.checkInCopy}>
          <Text style={styles.moodLabel}>{descriptor.label}</Text>
          <Text style={styles.dateText}>{formatCheckInDateTime(checkIn.recordedAt)}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{checkIn.value}</Text>
          <Text style={styles.scoreRange}>/100</Text>
        </View>
      </View>

      <View style={styles.meterTrack}>
        <LinearGradient
          colors={[colors.violetDeep, colors.hotPink, colors.sunshine]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={[styles.meterFill, { width: `${checkIn.value}%` }]}
        />
      </View>

      {checkIn.note ? (
        <View style={styles.reflection}>
          <Text style={styles.reflectionLabel}>REFLECTION</Text>
          <Text style={styles.reflectionText}>{checkIn.note}</Text>
        </View>
      ) : (
        <Text style={styles.noReflection}>No reflection added.</Text>
      )}
    </LinearGradient>
  );
}

function getCheckInColors(value: number): readonly [string, string] {
  if (value <= 20) {
    return [colors.lavender, colors.lavenderSoft];
  }

  if (value <= 40) {
    return [colors.roseSoft, colors.peachSoft];
  }

  if (value <= 60) {
    return [colors.peachSoft, colors.sunshineSoft];
  }

  if (value <= 80) {
    return [colors.tealMist, colors.mintSoft];
  }

  return [colors.sunshineSoft, colors.vitalitySoft];
}

function formatCheckInDateTime(recordedAt: string) {
  const date = new Date(recordedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dayLabel = isSameCalendarDay(date, today)
    ? 'Today'
    : isSameCalendarDay(date, yesterday)
      ? 'Yesterday'
      : date.toLocaleDateString([], {
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
        });
  const timeLabel = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${dayLabel} · ${timeLabel}`;
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: theme.spacing.xl,
    paddingBottom: 116,
    paddingTop: theme.spacing.sm,
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
  historySection: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  checkInList: {
    gap: theme.spacing.md,
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
  reflection: {
    gap: theme.spacing.xxs,
  },
  reflectionLabel: {
    color: colors.magentaDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.2,
    lineHeight: theme.typography.lineHeight.sm,
  },
  reflectionText: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  noReflection: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    fontStyle: 'italic',
  },
});
