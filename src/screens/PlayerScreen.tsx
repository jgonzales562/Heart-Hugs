import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bookmark, Check, Clock3 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import { BreathingPressable } from '../components/BreathingPressable';
import { GradientScreen } from '../components/GradientScreen';
import { MediaPlayer } from '../components/MediaPlayer';
import { SessionCard } from '../components/SessionCard';
import { sessionRepository } from '../content/sessionRepository';
import { getSessionArtwork } from '../data/sessionArtwork';
import { useWellness } from '../state/WellnessProvider';
import { colors, theme } from '../theme';
import { RootStackScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function PlayerScreen({ navigation, route }: RootStackScreenProps<'Player'>) {
  const activeSession = sessionRepository.getById(route.params.sessionId) ?? sessionRepository.getDefault();
  const sessions = sessionRepository.getAll();
  const {
    markSessionCompleted,
    recordOpened,
    saveProgress,
    state,
    toggleSaved,
  } = useWellness();
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const activity = state.activityBySessionId[activeSession.id];
  const [resumePosition] = useState(activity?.positionSeconds ?? 0);
  const isSaved = state.savedSessionIds.includes(activeSession.id);
  const isCompleted = completedSessionId === activeSession.id;
  const relatedSessions = sessions
    .filter(
      (session) =>
        session.id !== activeSession.id &&
        session.needIds.some((needId) => activeSession.needIds.includes(needId))
    )
    .concat(sessions.filter((session) => session.id !== activeSession.id))
    .filter(
      (session, index, allSessions) =>
        allSessions.findIndex((candidate) => candidate.id === session.id) === index
    )
    .slice(0, 2);

  useEffect(() => {
    recordOpened(activeSession.id);
  }, [activeSession.id, recordOpened]);

  function handleProgress(currentTime: number, duration: number) {
    saveProgress(activeSession.id, currentTime, duration);
  }

  function handleCompletion() {
    markSessionCompleted(activeSession.id);
    setCompletedSessionId(activeSession.id);
  }

  function openRelatedSession(session: Session) {
    navigation.replace('Player', { sessionId: session.id });
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} includeBottomSafeArea scroll>
      <ImageBackground
        imageStyle={styles.heroImage}
        source={getSessionArtwork(activeSession)}
        style={styles.hero}
      >
        <LinearGradient
          colors={['rgba(27, 16, 55, 0.08)', 'rgba(27, 16, 55, 0.9)']}
          style={styles.heroOverlay}
        >
          <View style={styles.heroActions}>
            <BreathingPressable
              accessibilityLabel="Return to the previous screen"
              accessibilityRole="button"
              hitSlop={theme.spacing.xs}
              onPress={navigation.goBack}
              style={styles.heroButton}
            >
              <ArrowLeft color={colors.white} size={22} />
            </BreathingPressable>
            <BreathingPressable
              accessibilityLabel={isSaved ? `Remove ${activeSession.title} from Saved` : `Save ${activeSession.title}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSaved }}
              hitSlop={theme.spacing.xs}
              onPress={() => toggleSaved(activeSession.id)}
              style={[
                styles.heroButton,
                isSaved && styles.savedButton,
              ]}
            >
              <Bookmark
                color={isSaved ? colors.navy : colors.white}
                fill={isSaved ? colors.white : 'transparent'}
                size={21}
              />
            </BreathingPressable>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{activeSession.category}</Text>
            <Text style={styles.title}>{activeSession.title}</Text>
            <View style={styles.heroMetaRow}>
              <Clock3 color={colors.whiteMuted} size={15} />
              <Text style={styles.heroMeta}>{activeSession.durationMinutes} min</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.activeSession}>
        <View>
          <Text style={styles.sectionEyebrow}>NOW PLAYING</Text>
          <Text style={styles.sectionTitle}>Your session</Text>
        </View>
        <MediaPlayer
          initialPosition={resumePosition}
          key={activeSession.id}
          onComplete={handleCompletion}
          onProgress={handleProgress}
          session={activeSession}
        />
        {resumePosition > 1 ? (
          <Text accessibilityLiveRegion="polite" style={styles.resumeNote}>
            Resumed from your last listening position.
          </Text>
        ) : null}
        {isCompleted ? (
          <View accessibilityLiveRegion="polite" style={styles.completionPanel}>
            <View style={styles.completionIcon}>
              <Check color={colors.navy} size={19} />
            </View>
            <View style={styles.completionCopy}>
              <Text style={styles.completionTitle}>Session complete</Text>
              <Text style={styles.completionText}>Take a moment to notice how you feel now.</Text>
            </View>
          </View>
        ) : null}
        <SessionContext session={activeSession} />
      </View>

      {activeSession.transcript ? (
        <View style={styles.transcriptPanel}>
          <Text style={styles.sectionEyebrow}>TRANSCRIPT</Text>
          <Text style={styles.contextText}>{activeSession.transcript}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>KEEP EXPLORING</Text>
        <Text style={styles.sectionTitle}>More for this moment</Text>
        <View style={styles.sessionList}>
          {relatedSessions.map((session) => (
            <SessionCard
              isSaved={state.savedSessionIds.includes(session.id)}
              key={session.id}
              onPress={openRelatedSession}
              onToggleSaved={(selectedSession) => toggleSaved(selectedSession.id)}
              session={session}
            />
          ))}
        </View>
      </View>
    </GradientScreen>
  );
}

function SessionContext({ session }: { session: Session }) {
  return (
    <View style={styles.sessionContext}>
      <View style={styles.contextMetaRow}>
        <Text style={styles.contextMeta}>{session.mediaType === 'audio' ? 'Audio' : 'Video'}</Text>
        <Text style={styles.contextDivider}>/</Text>
        <Text style={styles.contextMeta}>By {session.authorName}</Text>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextLabel}>May help you</Text>
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
  screen: {
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  hero: {
    marginBottom: theme.spacing.xl,
    minHeight: 286,
  },
  heroImage: {
    borderRadius: 34,
  },
  heroOverlay: {
    borderRadius: 34,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 286,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 37, 56, 0.46)',
    borderColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  savedButton: {
    backgroundColor: colors.leafBright,
    borderColor: colors.leafBright,
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
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 40,
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
