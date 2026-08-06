import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Clock3, X } from 'lucide-react-native';

import { GradientScreen } from '../components/GradientScreen';
import { MediaPlayer } from '../components/MediaPlayer';
import { SessionCard } from '../components/SessionCard';
import { getDefaultSession, getSessionById, sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { RootStackScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function PlayerScreen({ navigation, route }: RootStackScreenProps<'Player'>) {
  const [inlineSessionId, setInlineSessionId] = useState<string | null>(null);
  const [isActivePlayerOpen, setIsActivePlayerOpen] = useState(true);
  const activeSession = getSessionById(route.params.sessionId) ?? getDefaultSession();
  const relatedSessions = sessions
    .filter((session) => session.id !== activeSession.id && session.category === activeSession.category)
    .concat(sessions.filter((session) => session.id !== activeSession.id))
    .filter(
      (session, index, allSessions) =>
        allSessions.findIndex((candidate) => candidate.id === session.id) === index
    )
    .slice(0, 2);

  function openActivePlayer() {
    setIsActivePlayerOpen(true);
  }

  function closeActivePlayer() {
    setIsActivePlayerOpen(false);
  }

  function openInlineSession(session: Session) {
    setInlineSessionId(session.id);
  }

  function closeInlineSession() {
    setInlineSessionId(null);
  }

  return (
    <GradientScreen contentContainerStyle={styles.screen} includeBottomSafeArea scroll>
      <ImageBackground
        imageStyle={styles.heroImage}
        source={{ uri: activeSession.thumbnailUrl }}
        style={styles.hero}
      >
        <LinearGradient
          colors={['rgba(6, 29, 47, 0.18)', 'rgba(6, 29, 47, 0.82)']}
          style={styles.heroOverlay}
        >
          <Pressable
            accessibilityLabel="Return to the previous screen"
            accessibilityRole="button"
            hitSlop={8}
            onPress={navigation.goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.closeButtonPressed]}
          >
            <ArrowLeft color={colors.white} size={22} />
          </Pressable>

          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{activeSession.category}</Text>
            <Text style={styles.title}>{activeSession.title}</Text>
            <View style={styles.heroMetaRow}>
              <Clock3 color={colors.whiteMuted} size={15} />
              <Text style={styles.heroMeta}>{activeSession.durationMinutes} min</Text>
              <Text style={styles.heroMetaDivider}>·</Text>
              <Text style={styles.heroMeta}>{activeSession.difficulty}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      {isActivePlayerOpen ? (
        <View style={styles.activeSession}>
          <View style={styles.activeHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>NOW PLAYING</Text>
              <Text style={styles.activeTitle}>Your session</Text>
            </View>
            <Pressable
              accessibilityLabel={`Close ${activeSession.title} player`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={closeActivePlayer}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <X color={colors.white} size={18} />
            </Pressable>
          </View>
          <MediaPlayer key={activeSession.id} session={activeSession} />
          <SessionContext session={activeSession} />
        </View>
      ) : (
        <View style={styles.activeSession}>
          <SessionCard onPress={openActivePlayer} session={activeSession} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>KEEP EXPLORING</Text>
        <Text style={styles.sectionTitle}>More for this moment</Text>
        <View style={styles.sessionList}>
          {relatedSessions.map((session) =>
            session.id === inlineSessionId ? (
              <View key={session.id} style={styles.inlineSession}>
                <Pressable
                  accessibilityLabel={`Close ${session.title} player`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={closeInlineSession}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                >
                  <X color={colors.white} size={18} />
                </Pressable>
                <SessionContext compact session={session} />
                <MediaPlayer key={session.id} session={session} />
              </View>
            ) : (
              <SessionCard key={session.id} onPress={openInlineSession} session={session} />
            )
          )}
        </View>
      </View>
    </GradientScreen>
  );
}

type SessionContextProps = {
  compact?: boolean;
  session: Session;
};

function SessionContext({ compact = false, session }: SessionContextProps) {
  const mediaLabel = session.mediaType === 'audio' ? 'Audio' : 'Video';
  const benefits = session.benefits.slice(0, compact ? 1 : 2);
  const tags = session.tags.slice(0, compact ? 2 : 3);

  return (
    <View style={[styles.sessionContext, compact && styles.compactSessionContext]}>
      <View style={styles.contextMetaRow}>
        <Text style={styles.contextMeta}>{session.durationMinutes} min</Text>
        <Text style={styles.contextDivider}>/</Text>
        <Text style={styles.contextMeta}>{session.difficulty}</Text>
        <Text style={styles.contextDivider}>/</Text>
        <Text style={styles.contextMeta}>{mediaLabel}</Text>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextLabel}>Benefits</Text>
        <Text style={styles.contextText}>{benefits.join(', ')}</Text>
      </View>

      <View style={styles.tagList}>
        {tags.map((tag) => (
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
    height: 286,
    marginBottom: theme.spacing.xl,
  },
  heroImage: {
    borderRadius: 34,
  },
  heroOverlay: {
    borderRadius: 34,
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 37, 56, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  heroMeta: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  heroMetaDivider: {
    color: colors.whiteMuted,
    fontSize: theme.typography.size.sm,
  },
  section: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  sectionEyebrow: {
    color: colors.teal,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    letterSpacing: 1.5,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sessionList: {
    gap: theme.spacing.md,
  },
  activeSession: {
    gap: theme.spacing.md,
  },
  activeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activeTitle: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  inlineSession: {
    gap: theme.spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  closeButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  sessionContext: {
    backgroundColor: 'rgba(7, 31, 49, 0.64)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    elevation: 2,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  compactSessionContext: {
    marginBottom: 0,
  },
  contextMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  contextMeta: {
    color: colors.teal,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  contextDivider: {
    color: colors.whiteMuted,
    fontSize: theme.typography.size.sm,
  },
  contextBlock: {
    gap: theme.spacing.xxs,
  },
  contextLabel: {
    color: colors.white,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'uppercase',
  },
  contextText: {
    color: colors.whiteMuted,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.whiteMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'capitalize',
  },
});
