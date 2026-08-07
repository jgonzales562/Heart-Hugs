import { Settings, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientScreen } from '../components/GradientScreen';
import { PlaybackProgress } from '../components/PlaybackProgress';
import { SessionCard } from '../components/SessionCard';
import { recommendSessions } from '../content/recommendations';
import {
  DurationPreference,
  durationOptions,
  sessionRepository,
  wellnessNeeds,
} from '../content/sessionRepository';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import { MainTabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function TodayScreen({ navigation }: MainTabScreenProps<'Today'>) {
  const {
    isHydrated,
    setDurationPreference,
    setNeedPreference,
    state,
    toggleSaved,
  } = useWellness();
  const sessions = sessionRepository.getAll();
  const recommendations = useMemo(
    () =>
      recommendSessions({
        durationMinutes: state.durationPreference,
        needId: state.needPreference,
      }),
    [state.durationPreference, state.needPreference]
  );
  const recommendedSession = recommendations[0] ?? sessionRepository.getDefault();
  const selectedNeed = wellnessNeeds.find((need) => need.id === state.needPreference);
  const recentSessions = useMemo(
    () =>
      Object.entries(state.activityBySessionId)
        .sort(([, left], [, right]) => right.lastPlayedAt.localeCompare(left.lastPlayedAt))
        .map(([sessionId]) => sessionRepository.getById(sessionId))
        .filter((session): session is Session => Boolean(session))
        .slice(0, 4),
    [state.activityBySessionId]
  );
  const continueSession = recentSessions.find((session) => {
    const activity = state.activityBySessionId[session.id];

    return activity.positionSeconds >= 5 && activity.durationSeconds > activity.positionSeconds + 2;
  });

  function openSession(session: Session) {
    navigation.navigate('Player', { sessionId: session.id });
  }

  function renderDurationLabel(duration: DurationPreference) {
    return duration === null ? 'Any' : `${duration} min`;
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} scroll>
      <View style={styles.topBar}>
        <View style={styles.brandCopy}>
          <Text style={styles.eyebrow}>HEART HUGS</Text>
          <Text style={styles.title}>What would help right now?</Text>
        </View>
        <Pressable
          accessibilityLabel="Open settings and safety information"
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          onPress={() => navigation.navigate('Settings')}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        >
          <Settings color={colors.textPrimary} size={21} />
        </Pressable>
      </View>

      {continueSession ? (
        <ContinueCard
          activity={state.activityBySessionId[continueSession.id]}
          onPress={() => openSession(continueSession)}
          session={continueSession}
        />
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <Sparkles color={colors.coralDeep} size={17} />
          </View>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionEyebrow}>CHOOSE YOUR MOMENT</Text>
            <Text style={styles.sectionTitle}>Start with what you need</Text>
          </View>
        </View>

        <View accessibilityRole="radiogroup" style={styles.needGrid}>
          {wellnessNeeds.map((need) => {
            const isSelected = need.id === state.needPreference;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                key={need.id}
                onPress={() => setNeedPreference(need.id)}
                style={({ pressed }) => [
                  styles.needButton,
                  isSelected && styles.selectedNeedButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.needLabel, isSelected && styles.selectedNeedLabel]}>
                  {need.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.needDescription}>
          {selectedNeed?.description}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>HOW MUCH TIME DO YOU HAVE?</Text>
        <View accessibilityRole="radiogroup" style={styles.durationRow}>
          {[...durationOptions, null].map((duration) => {
            const isSelected = duration === state.durationPreference;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                key={duration ?? 'any'}
                onPress={() => setDurationPreference(duration)}
                style={({ pressed }) => [
                  styles.durationButton,
                  isSelected && styles.selectedDurationButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.durationText, isSelected && styles.selectedDurationText]}
                >
                  {renderDurationLabel(duration)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>RECOMMENDED FOR YOU</Text>
        <Text style={styles.sectionTitle}>{isHydrated ? 'A gentle next step' : 'Finding a practice…'}</Text>
        <SessionCard
          isSaved={state.savedSessionIds.includes(recommendedSession.id)}
          onPress={openSession}
          onToggleSaved={(session) => toggleSaved(session.id)}
          session={recommendedSession}
          variant="large"
        />
      </View>

      {recentSessions.length > 0 ? (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recently opened</Text>
            <Text style={styles.recentCount}>{recentSessions.length}</Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.horizontalList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {recentSessions.map((session) => (
              <SessionCard
                isSaved={state.savedSessionIds.includes(session.id)}
                key={session.id}
                onPress={openSession}
                onToggleSaved={(selectedSession) => toggleSaved(selectedSession.id)}
                session={session}
                variant="tile"
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>MORE PRACTICES</Text>
        <Text style={styles.sectionTitle}>Browse at your own pace</Text>
        <View style={styles.sessionList}>
          {sessions
            .filter((session) => session.id !== recommendedSession.id)
            .map((session) => (
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

      <Text style={styles.catalogNote}>{sessions.length} supportive practices available</Text>
    </GradientScreen>
  );
}

type ContinueCardProps = {
  activity: { durationSeconds: number; positionSeconds: number };
  onPress: () => void;
  session: Session;
};

function ContinueCard({ activity, onPress, session }: ContinueCardProps) {
  const progress = activity.durationSeconds
    ? activity.positionSeconds / activity.durationSeconds
    : 0;

  return (
    <Pressable
      accessibilityLabel={`Continue ${session.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
    >
      <Text style={[styles.sectionEyebrow, styles.continueEyebrow]}>CONTINUE LISTENING</Text>
      <Text style={styles.continueTitle}>{session.title}</Text>
      <PlaybackProgress
        currentTime={activity.positionSeconds}
        duration={activity.durationSeconds}
        progress={progress}
        tone="overlay"
      />
    </Pressable>
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
  brandCopy: {
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
    fontSize: 38,
    letterSpacing: -1,
    lineHeight: 44,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  continueCard: {
    backgroundColor: colors.leafDeep,
    borderColor: colors.leaf,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    elevation: 4,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  continueTitle: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  continueEyebrow: {
    color: colors.sunshineSoft,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionHeadingCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.vitalitySoft,
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sectionEyebrow: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.5,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  needGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  needButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 52,
    minWidth: '46%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedNeedButton: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.leaf,
  },
  needLabel: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  selectedNeedLabel: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  needDescription: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  durationButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedDurationButton: {
    backgroundColor: colors.leafDeep,
    borderColor: colors.leafDeep,
  },
  durationText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
  },
  selectedDurationText: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  recentSection: {
    gap: theme.spacing.md,
    marginHorizontal: -theme.spacing.lg,
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  recentCount: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
  },
  horizontalList: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  sessionList: {
    gap: theme.spacing.md,
  },
  catalogNote: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    textAlign: 'center',
  },
});
