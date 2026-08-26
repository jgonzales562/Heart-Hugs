import { Settings, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { MoodThermometer } from '../components/MoodThermometer';
import { PlaybackProgress } from '../components/PlaybackProgress';
import { SessionCard } from '../components/SessionCard';
import {
  sessionRepository,
  wellnessNeeds,
} from '../content/sessionRepository';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import { MainTabScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function TodayScreen({ navigation }: MainTabScreenProps<'Today'>) {
  const [isMoodDragging, setIsMoodDragging] = useState(false);
  const {
    isHydrated,
    logMood,
    setNeedPreference,
    state,
    toggleSaved,
  } = useWellness();
  const sessions = sessionRepository.getAll();
  const recommendations = useMemo(
    () =>
      sessions.filter((session) =>
        session.needIds.includes(state.needPreference)
      ),
    [sessions, state.needPreference]
  );
  const recommendedSessionIds = new Set(recommendations.map((session) => session.id));
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

  return (
    <GradientScreen
      contentContainerStyle={styles.screen}
      scroll
      scrollEnabled={!isMoodDragging}
    >
      <View style={styles.topBar}>
        <View style={styles.brandCopy}>
          <Text style={styles.eyebrow}>HEART HUGS</Text>
          <Text style={styles.title}>Come back to yourself.</Text>
        </View>
        <BreathingPressable
          accessibilityLabel="Open settings and safety information"
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
        >
          <Settings color={colors.textPrimary} size={21} />
        </BreathingPressable>
      </View>

      <MoodThermometer
        latestCheckIn={state.moodCheckIns[0]}
        onDragStateChange={setIsMoodDragging}
        onLogMood={logMood}
      />

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
              <BreathingPressable
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                containerStyle={styles.needButtonContainer}
                key={need.id}
                onPress={() => setNeedPreference(need.id)}
                style={[
                  styles.needButton,
                  isSelected && styles.selectedNeedButton,
                ]}
              >
                <Text style={[styles.needLabel, isSelected && styles.selectedNeedLabel]}>
                  {need.label}
                </Text>
              </BreathingPressable>
            );
          })}
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.needDescription}>
          {selectedNeed?.description}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>RECOMMENDED FOR YOU</Text>
        <Text style={styles.sectionTitle}>
          {isHydrated ? `${selectedNeed?.label ?? 'Selected'} practices` : 'Finding a practice…'}
        </Text>
        {recommendations.length > 0 ? (
          <View style={styles.sessionList}>
            {recommendations.map((session, index) => (
              <SessionCard
                isSaved={state.savedSessionIds.includes(session.id)}
                key={session.id}
                onPress={openSession}
                onToggleSaved={(selectedSession) => toggleSaved(selectedSession.id)}
                session={session}
                variant={index === 0 ? 'large' : 'compact'}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyRecommendation}>
            <Text style={styles.emptyRecommendationTitle}>More sessions are on the way.</Text>
            <Text style={styles.emptyRecommendationText}>
              We are preparing practices for {selectedNeed?.label ?? 'this filter'}.
            </Text>
          </View>
        )}
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
            .filter((session) => !recommendedSessionIds.has(session.id))
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
    <BreathingPressable
      accessibilityLabel={`Continue ${session.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.continueCard}
    >
      <Text style={[styles.sectionEyebrow, styles.continueEyebrow]}>CONTINUE LISTENING</Text>
      <Text style={styles.continueTitle}>{session.title}</Text>
      <PlaybackProgress
        currentTime={activity.positionSeconds}
        duration={activity.durationSeconds}
        progress={progress}
        tone="overlay"
      />
    </BreathingPressable>
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
    fontSize: 40,
    letterSpacing: -1,
    lineHeight: 45,
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
  continueCard: {
    backgroundColor: colors.magentaDeep,
    borderColor: colors.hotPink,
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
  needButtonContainer: {
    flexBasis: '46%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  needButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  selectedNeedButton: {
    backgroundColor: colors.lavender,
    borderColor: colors.magenta,
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
  emptyRecommendation: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  emptyRecommendationTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  emptyRecommendationText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
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
