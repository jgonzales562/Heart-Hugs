import { ArrowLeft, Bookmark, Check, Clock3 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { MediaPlayer } from '../components/MediaPlayer';
import { SessionCard } from '../components/SessionCard';
import { sessionRepository } from '../content/sessionRepository';
import { getSessionArtwork } from '../data/sessionArtwork';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import type { RootStackScreenProps } from '../types/navigation';
import type { Session } from '../types/session';
import { getRelatedSessions } from '../utils/sessionDiscovery';

const ALL_SESSIONS = sessionRepository.getAll();
const PLAYER_OVERLAY_COLORS = ['transparent', 'transparent'] as const;
const COMPLETION_TITLE = 'Session complete';
const COMPLETION_MESSAGE = 'Take a moment to notice how you feel now.';
const COMPLETION_ANNOUNCEMENT = `${COMPLETION_TITLE}. ${COMPLETION_MESSAGE}`;

type PlayerNavigationProps = {
  readonly navigation: RootStackScreenProps<'Player'>['navigation'];
};

type PlayerExperienceProps = PlayerNavigationProps & {
  readonly activeSession: Session;
};

type SessionContextProps = {
  readonly session: Session;
};

export function PlayerScreen({ navigation, route }: RootStackScreenProps<'Player'>): ReactElement {
  const activeSession = sessionRepository.getById(route.params.sessionId);

  if (!activeSession) {
    return <UnavailableSession navigation={navigation} />;
  }

  return (
    <PlayerExperience activeSession={activeSession} key={activeSession.id} navigation={navigation} />
  );
}

function UnavailableSession({ navigation }: PlayerNavigationProps): ReactElement {
  function returnToToday(): void {
    navigation.popTo('MainTabs', { screen: 'Today' });
  }

  return (
    <GradientScreen contentContainerStyle={styles.unavailableScreen} includeBottomSafeArea scroll>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Session unavailable</Text>
      <Text style={[styles.contextText, styles.unavailableMessage]}>
        This session could not be found. Explore Today to choose another practice.
      </Text>
      <BreathingPressable accessibilityRole="button" onPress={returnToToday} style={styles.todayButton}>
        <Text style={styles.todayButtonText}>Return to Today</Text>
      </BreathingPressable>
    </GradientScreen>
  );
}

function PlayerExperience({ activeSession, navigation }: PlayerExperienceProps): ReactElement {
  const {
    markSessionCompleted,
    recordOpened,
    saveProgress,
    state,
    toggleSaved,
  } = useWellness();
  const [isCompleted, setIsCompleted] = useState(false);
  const activity = state.activityBySessionId[activeSession.id];
  const [resumePosition] = useState(activity?.positionSeconds ?? 0);
  const savedSessionIds = useMemo(() => new Set(state.savedSessionIds), [state.savedSessionIds]);
  const isSaved = savedSessionIds.has(activeSession.id);
  const relatedSessions = useMemo(
    () => getRelatedSessions(ALL_SESSIONS, activeSession),
    [activeSession]
  );

  useEffect(() => {
    recordOpened(activeSession.id);
  }, [activeSession.id, recordOpened]);

  useEffect(() => {
    if (isCompleted && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions(COMPLETION_ANNOUNCEMENT, { queue: true });
    }
  }, [isCompleted]);

  const handleProgress = useCallback((currentTime: number, duration: number): void => {
    saveProgress(activeSession.id, currentTime, duration);
  }, [activeSession.id, saveProgress]);

  const handlePause = useCallback((currentTime: number, duration: number): void => {
    saveProgress(activeSession.id, currentTime, duration, true);
  }, [activeSession.id, saveProgress]);

  const handleCompletion = useCallback((): void => {
    markSessionCompleted(activeSession.id);
    setIsCompleted(true);
  }, [activeSession.id, markSessionCompleted]);

  const openRelatedSession = useCallback((session: Session): void => {
    navigation.replace('Player', { sessionId: session.id });
  }, [navigation]);

  const toggleSessionSaved = useCallback((session: Session): void => {
    toggleSaved(session.id);
  }, [toggleSaved]);

  const toggleActiveSessionSaved = useCallback((): void => {
    toggleSaved(activeSession.id);
  }, [activeSession.id, toggleSaved]);

  return (
    <GradientScreen
      backgroundImageSource={getSessionArtwork(activeSession)}
      backgroundOverlayColors={PLAYER_OVERLAY_COLORS}
      contentContainerStyle={styles.screen}
      includeBottomSafeArea
      scroll
    >
      <View style={styles.playerNav}>
        <BreathingPressable
          accessibilityLabel="Return to the previous screen"
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          onPress={navigation.goBack}
          style={styles.navButton}
        >
          <ArrowLeft
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            color={colors.navy}
            size={22}
          />
        </BreathingPressable>
        <BreathingPressable
          accessibilityLabel={isSaved ? `Remove ${activeSession.title} from Saved` : `Save ${activeSession.title}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isSaved }}
          hitSlop={theme.spacing.xs}
          onPress={toggleActiveSessionSaved}
          style={[
            styles.navButton,
            isSaved && styles.savedButton,
          ]}
        >
          <Bookmark
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            color={colors.navy}
            fill={isSaved ? colors.white : 'transparent'}
            size={21}
          />
        </BreathingPressable>
      </View>

      <View style={styles.sessionIntro}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{activeSession.category}</Text>
          <Text accessibilityRole="header" style={styles.title}>{activeSession.title}</Text>
          <View style={styles.heroMetaRow}>
            <Clock3
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              color={colors.white}
              size={15}
            />
            <Text style={styles.heroMeta}>{activeSession.durationMinutes} min</Text>
          </View>
        </View>
      </View>

      <View style={styles.activeSession}>
        <View>
          <Text style={[styles.sectionEyebrow, styles.artworkEyebrow]}>NOW PLAYING</Text>
          <Text accessibilityRole="header" style={[styles.sectionTitle, styles.artworkTitle]}>Your session</Text>
        </View>
        <MediaPlayer
          initialPosition={resumePosition}
          onComplete={handleCompletion}
          onPause={handlePause}
          onProgress={handleProgress}
          session={activeSession}
        />
        {resumePosition > 1 && !isCompleted ? (
          <Text style={[styles.resumeNote, styles.artworkSupportingText]}>
            Continue from your last listening position.
          </Text>
        ) : null}
        {isCompleted ? (
          <View
            accessible
            accessibilityLabel={COMPLETION_ANNOUNCEMENT}
            accessibilityLiveRegion="polite"
            role="status"
            style={styles.completionPanel}
          >
            <View style={styles.completionIcon}>
              <Check
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                color={colors.navy}
                size={19}
              />
            </View>
            <View style={styles.completionCopy}>
              <Text style={styles.completionTitle}>{COMPLETION_TITLE}</Text>
              <Text style={styles.completionText}>{COMPLETION_MESSAGE}</Text>
            </View>
          </View>
        ) : null}
        <SessionContext session={activeSession} />
      </View>

      {activeSession.transcript ? (
        <View style={styles.transcriptPanel}>
          <Text accessibilityRole="header" style={styles.sectionEyebrow}>TRANSCRIPT</Text>
          <Text style={styles.contextText}>{activeSession.transcript}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionEyebrow, styles.artworkEyebrow]}>KEEP EXPLORING</Text>
        <Text accessibilityRole="header" style={[styles.sectionTitle, styles.artworkTitle]}>More for this moment</Text>
        <View style={styles.sessionList}>
          {relatedSessions.map((session) => (
            <SessionCard
              isSaved={savedSessionIds.has(session.id)}
              key={session.id}
              onPress={openRelatedSession}
              onToggleSaved={toggleSessionSaved}
              session={session}
            />
          ))}
        </View>
      </View>
    </GradientScreen>
  );
}

function SessionContext({ session }: SessionContextProps): ReactElement {
  return (
    <View style={styles.sessionContext}>
      <View style={styles.contextMetaRow}>
        <Text style={styles.contextMeta}>{session.mediaType === 'audio' ? 'Audio' : 'Video'}</Text>
        <Text
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.contextDivider}
        >
          /
        </Text>
        <Text style={styles.contextMeta}>By {session.authorName}</Text>
      </View>

      <View style={styles.contextBlock}>
        <Text accessibilityRole="header" style={styles.contextLabel}>May help you</Text>
        <Text style={styles.contextText}>{session.benefits.join(', ')}</Text>
      </View>

      <View style={styles.tagList}>
        {session.tags.map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  unavailableScreen: {
    alignItems: 'center',
    flexGrow: 1,
    gap: theme.spacing.lg,
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl,
  },
  unavailableMessage: {
    textAlign: 'center',
  },
  todayButton: {
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  todayButtonText: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    textAlign: 'center',
  },
  screen: {
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  playerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    elevation: 3,
    height: 46,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: 46,
  },
  savedButton: {
    backgroundColor: colors.sunshine,
    borderColor: colors.sunshine,
  },
  sessionIntro: {
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.xl,
    minHeight: 210,
  },
  heroCopy: {
    gap: theme.spacing.xs,
  },
  heroEyebrow: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.7,
    lineHeight: theme.typography.lineHeight.sm,
    textShadowColor: 'rgba(19, 9, 42, 0.9)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 40,
    textShadowColor: 'rgba(19, 9, 42, 0.92)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 9,
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  heroMeta: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    textShadowColor: 'rgba(19, 9, 42, 0.9)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 5,
  },
  activeSession: {
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  sectionEyebrow: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.5,
    lineHeight: theme.typography.lineHeight.sm,
  },
  artworkTitle: {
    color: colors.white,
    textShadowColor: 'rgba(19, 9, 42, 0.7)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 7,
  },
  artworkEyebrow: {
    color: colors.sunshineSoft,
    textShadowColor: 'rgba(19, 9, 42, 0.76)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 5,
  },
  artworkSupportingText: {
    color: colors.whiteMuted,
    textShadowColor: 'rgba(19, 9, 42, 0.76)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4,
  },
  resumeNote: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    textAlign: 'center',
  },
  completionPanel: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderColor: colors.leaf,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  completionIcon: {
    alignItems: 'center',
    backgroundColor: colors.sunshine,
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  completionCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  completionTitle: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.md,
  },
  completionText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
  },
  sessionContext: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  transcriptPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  contextMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  contextMeta: {
    color: colors.leafDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  contextDivider: {
    color: colors.textSecondary,
  },
  contextBlock: {
    gap: theme.spacing.xxs,
  },
  contextLabel: {
    color: colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'uppercase',
  },
  contextText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.md,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tagPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'capitalize',
  },
  sessionList: {
    gap: theme.spacing.md,
  },
});
