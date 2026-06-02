import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

import { GradientScreen } from '../components/GradientScreen';
import { MediaPlayer } from '../components/MediaPlayer';
import { SessionCard } from '../components/SessionCard';
import { getDefaultSession, getSessionById, sessions } from '../data/sessions';
import { colors, theme } from '../theme';
import { RootStackScreenProps } from '../types/navigation';
import { Session } from '../types/session';

export function PlayerScreen({ route }: RootStackScreenProps<'Player'>) {
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

  useEffect(() => {
    setInlineSessionId(null);
    setIsActivePlayerOpen(true);
  }, [activeSession.id]);

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
    <GradientScreen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Player</Text>
        <Text style={styles.subtitle}>{activeSession.category}</Text>
      </View>

      {isActivePlayerOpen ? (
        <View style={styles.activeSession}>
          <Pressable
            accessibilityLabel={`Close ${activeSession.title} player`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={closeActivePlayer}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <X color={colors.navy} size={18} />
          </Pressable>
          <SessionContext session={activeSession} />
          <MediaPlayer key={activeSession.id} session={activeSession} />
        </View>
      ) : (
        <SessionCard onPress={openActivePlayer} session={activeSession} />
      )}

      <View style={styles.section}>
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
                  <X color={colors.navy} size={18} />
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
  header: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
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
  section: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  sessionList: {
    gap: theme.spacing.md,
  },
  activeSession: {
    gap: theme.spacing.md,
  },
  inlineSession: {
    gap: theme.spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
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
    backgroundColor: colors.offWhiteTransparent,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
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
    color: colors.tealDeep,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  contextDivider: {
    color: colors.lavender,
    fontSize: theme.typography.size.sm,
  },
  contextBlock: {
    gap: theme.spacing.xxs,
  },
  contextLabel: {
    color: colors.navy,
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'uppercase',
  },
  contextText: {
    color: colors.inkMuted,
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
    backgroundColor: colors.warmWhite,
    borderColor: colors.lavenderMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  tagText: {
    color: colors.inkMuted,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.sm,
    textTransform: 'capitalize',
  },
});
