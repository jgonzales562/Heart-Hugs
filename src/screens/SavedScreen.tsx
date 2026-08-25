import { Bookmark, Compass, Settings } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { SessionCard } from '../components/SessionCard';
import { sessionRepository } from '../content/sessionRepository';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import { MainTabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function SavedScreen({ navigation }: MainTabScreenProps<'Saved'>) {
  const { state, toggleSaved } = useWellness();
  const savedSessions = state.savedSessionIds
    .map((sessionId) => sessionRepository.getById(sessionId))
    .filter((session): session is Session => Boolean(session));
  const completedCount = Object.values(state.activityBySessionId).reduce(
    (total, activity) => total + activity.completionCount,
    0
  );
  const recentSessions = Object.entries(state.activityBySessionId)
    .sort(([, left], [, right]) => right.lastPlayedAt.localeCompare(left.lastPlayedAt))
    .map(([sessionId]) => sessionRepository.getById(sessionId))
    .filter((session): session is Session => Boolean(session))
    .slice(0, 3);

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} scroll>
      <View style={styles.topBar}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR SPACE</Text>
          <Text style={styles.title}>Saved for when you need it</Text>
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
        <SummaryCard label="Saved" value={savedSessions.length} />
        <SummaryCard label="Completed" value={completedCount} />
      </View>

      {savedSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Bookmark color={colors.leafDeep} size={27} />
          </View>
          <Text style={styles.emptyTitle}>Your saved practices will appear here</Text>
          <Text style={styles.emptyText}>
            Save a session from Today or the player so it is easy to return to.
          </Text>
          <BreathingPressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Today')}
            style={styles.browseButton}
          >
            <Compass color={colors.navy} size={18} />
            <Text style={styles.browseButtonText}>Browse practices</Text>
          </BreathingPressable>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved practices</Text>
          <View style={styles.sessionList}>
            {savedSessions.map((session) => (
              <SessionCard
                isSaved
                key={session.id}
                onPress={openSession}
                onToggleSaved={(selectedSession) => toggleSaved(selectedSession.id)}
                session={session}
              />
            ))}
          </View>
        </View>
      )}

      {recentSessions.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.sessionList}>
            {recentSessions.map((session) => (
              <SessionCard
                isSaved={state.savedSessionIds.includes(session.id)}
                key={session.id}
                onPress={openSession}
                onToggleSaved={(selectedSession) => toggleSaved(selectedSession.id)}
                session={session}
              />
            ))}
          </View>
        </View>
      ) : null}
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xxs,
    padding: theme.spacing.lg,
  },
  summaryValue: {
    color: colors.leafDeep,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderRadius: theme.radius.full,
    height: 60,
    justifyContent: 'center',
    width: 60,
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
  browseButton: {
    alignItems: 'center',
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  browseButtonText: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  sessionList: {
    gap: theme.spacing.md,
  },
});
